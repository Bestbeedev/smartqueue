import { useEffect, useState, useCallback, useMemo } from 'react'
import { api } from '@/api/axios'
import { cn } from '@/lib/utils'
import { AnalyticsCard } from '@/components/ui/analytics-card'
import { ChartContainer } from '@/components/ui/chart-container'
import { AreaChartComponent, DonutChart, VerticalBarChart, LineChartComponent } from '@/components/ui/charts'
import {
  Ticket, CheckCircle2, UserX, Clock, Timer, CalendarClock,
  Activity, Star, Target, CalendarDays, RefreshCw,
  TrendingUp, TrendingDown, Lightbulb,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'custom'
type TabId = 'overview' | 'services' | 'tickets' | 'temporal' | 'deferred' | 'reviews'

interface Kpis {
  total: number; served: number; absent: number; expired: number
  active: number; deferred: number
  wait_avg_minutes: number | null; service_avg_minutes: number | null
  absenteeism_rate: number; completion_rate: number
}
interface PrevKpis {
  total: number; served: number; absent: number; absenteeism_rate: number; completion_rate: number
}
interface ServiceStat {
  service_id: number; service_name: string; total: number; served: number
  absent: number; deferred: number; wait_avg_minutes: number | null
  absenteeism_rate: number; completion_rate: number
  priority: { normal: number; high: number; vip: number; urgence: number }
  source: { app: number; qr_scan: number; agent: number; kiosk: number }
}
interface PriorityStat {
  priority: string; total: number; served: number; absent: number
  absenteeism_rate: number; wait_avg_minutes: number | null
}
interface SourceStat {
  source: string; total: number; served: number; absent: number
  absenteeism_rate: number; completion_rate: number
}
interface AdvancedStats {
  period: string; from: string; to: string
  kpis: Kpis; prev_kpis: PrevKpis
  by_service: ServiceStat[]; by_priority: PriorityStat[]; by_source: SourceStat[]
  by_hour: Array<{ hour: number; total: number; peak: boolean }>
  deferred: {
    total: number
    by_reason: Array<{ reason: string; count: number }>
    upcoming_load: Array<{ date: string; count: number }>
  }
}
interface SeriesPoint { bucket: string; created: number; closed: number; absent: number }
interface ReviewStats {
  total: number; global_avg: number | null
  distribution: Array<{ rating: number; count: number }>
  evolution: Array<{ date: string; avg_rating: number; count: number }>
  services: Array<{ service_id: number; service_name: string; avg_rating: number; total: number }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkChange(
  current: number,
  prev: number,
  lowerIsBetter = false,
): { value: number; type: 'increase' | 'decrease' | 'neutral' } | undefined {
  if (prev === 0) return undefined
  const pct = Math.round(((current - prev) / prev) * 100)
  if (pct === 0) return { value: 0, type: 'neutral' }
  const isGood = lowerIsBetter ? pct < 0 : pct > 0
  return { value: Math.abs(pct), type: isGood ? 'increase' : 'decrease' }
}

function fmtMin(m: number | null) { return m !== null ? `${m} min` : '—' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const PRIORITY_LABELS: Record<string, string> = {
  urgence: 'Urgence', vip: 'VIP', high: 'Prioritaire', normal: 'Normal',
}
const PRIORITY_COLORS: Record<string, string> = {
  urgence: '#ef4444', vip: '#8b5cf6', high: '#f59e0b', normal: '#3b82f6',
}
const SOURCE_LABELS: Record<string, string> = {
  app: 'Application', qr_scan: 'QR Code', agent: 'Agent', kiosk: 'Borne',
}
const SOURCE_COLORS: Record<string, string> = {
  app: '#3b82f6', qr_scan: '#10b981', agent: '#f59e0b', kiosk: '#8b5cf6',
}
const DEFER_REASON_LABELS: Record<string, string> = {
  past_cutoff: 'Hors horaires', critical_zone: 'Zone critique',
  non_working_day: 'Jour non ouvré', holiday: 'Jour férié',
  exceptional_closure: 'Fermeture except.',
}
const DEFER_REASON_COLORS: Record<string, string> = {
  past_cutoff: '#f59e0b', critical_zone: '#ef4444', non_working_day: '#8b5cf6',
  holiday: '#10b981', exceptional_closure: '#6b7280',
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui", week: '7 jours', month: '30 jours', custom: 'Personnalisé',
}
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'services', label: 'Par service' },
  { id: 'tickets', label: 'Analyse tickets' },
  { id: 'temporal', label: 'Activité' },
  { id: 'deferred', label: 'Reportés' },
  { id: 'reviews', label: 'Évaluations' },
]

function periodParams(period: Period, customFrom: string, customTo: string) {
  const today = new Date().toISOString().split('T')[0]
  if (period === 'today') return { from: today, to: today }
  if (period === 'week') return { from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], to: today }
  if (period === 'month') return { from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], to: today }
  return { from: customFrom || today, to: customTo || today }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= Math.round(value) ? 'text-amber-400' : 'text-muted-foreground/30'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function RateBadge({ rate, label }: { rate: number; label?: string }) {
  const color =
    rate > 20 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : rate > 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', color)}>
      {rate}%{label ? ` ${label}` : ''}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Stats() {
  const [period, setPeriod] = useState<Period>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [tab, setTab] = useState<TabId>('overview')

  const [advanced, setAdvanced] = useState<AdvancedStats | null>(null)
  const [advancedLoading, setAdvancedLoading] = useState(false)

  const [bucket, setBucket] = useState<'day' | 'hour'>('day')
  const [seriesServiceId, setSeriesServiceId] = useState('')
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [seriesLoading, setSeriesLoading] = useState(false)

  const [reviews, setReviews] = useState<ReviewStats | null>(null)

  // ── Fetch advanced ────────────────────────────────────────────────────────

  const fetchAdvanced = useCallback(() => {
    setAdvancedLoading(true)
    const params: Record<string, string> = { period }
    if (period === 'custom') {
      if (customFrom) params.from = customFrom
      if (customTo) params.to = customTo
    }
    api
      .get('/api/admin/stats/advanced', { params })
      .then(r => setAdvanced(r.data))
      .catch(() => setAdvanced(null))
      .finally(() => setAdvancedLoading(false))
  }, [period, customFrom, customTo])

  // ── Fetch time series ─────────────────────────────────────────────────────

  const fetchSeries = useCallback(() => {
    setSeriesLoading(true)
    const dateParams = periodParams(period, customFrom, customTo)
    const params: Record<string, string> = { bucket, ...dateParams }
    if (seriesServiceId) params.service_id = seriesServiceId
    api
      .get('/api/admin/stats/series', { params })
      .then(r => setSeries(Array.isArray(r.data?.series) ? r.data.series : []))
      .catch(() => setSeries([]))
      .finally(() => setSeriesLoading(false))
  }, [period, bucket, seriesServiceId, customFrom, customTo])

  useEffect(() => {
    api.get('/api/admin/reviews/stats').then(r => setReviews(r.data)).catch(() => setReviews(null))
  }, [])

  useEffect(() => { fetchAdvanced() }, [fetchAdvanced])
  useEffect(() => { fetchSeries() }, [fetchSeries])

  const k = advanced?.kpis
  const pk = advanced?.prev_kpis

  // Hourly data (fill all 24h, 0 for missing)
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const found = advanced?.by_hour.find(h => h.hour === i)
    return { bucket: `${String(i).padStart(2, '0')}h`, total: found?.total ?? 0 }
  })

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics SmartQueue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {advanced
              ? `${new Date(advanced.from).toLocaleDateString('fr-FR')} → ${new Date(advanced.to).toLocaleDateString('fr-FR')}`
              : 'Centre de pilotage intelligent'}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['today', 'week', 'month', 'custom'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                period === p
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:border-blue-400 hover:text-foreground',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              />
              <span className="text-muted-foreground text-sm">→</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              />
            </div>
          )}

          <button
            onClick={fetchAdvanced}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:border-blue-400 hover:text-foreground transition-all"
            title="Actualiser"
          >
            <RefreshCw className={cn('h-4 w-4', advancedLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Key Takeaways ── */}
      {k && advanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(() => {
            const insights: Array<{ icon: any; text: string; color: string; bg: string }> = []

            const completionColor = k.completion_rate >= 70 ? 'text-green-600' : k.completion_rate >= 50 ? 'text-amber-600' : 'text-red-600'
            const completionBg = k.completion_rate >= 70 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : k.completion_rate >= 50 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            insights.push({
              icon: Target,
              text: `Taux de réalisation : ${k.completion_rate}%`,
              color: completionColor,
              bg: completionBg,
            })

            if (k.absenteeism_rate > 0) {
              const absColor = k.absenteeism_rate > 20 ? 'text-red-600' : k.absenteeism_rate > 10 ? 'text-amber-600' : 'text-green-600'
              const absBg = k.absenteeism_rate > 20 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' : k.absenteeism_rate > 10 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
              insights.push({
                icon: UserX,
                text: `Absentéisme : ${k.absenteeism_rate}%`,
                color: absColor,
                bg: absBg,
              })
            }

            if (pk) {
              const compDiff = pk.completion_rate > 0 ? Math.round(((k.completion_rate - pk.completion_rate) / pk.completion_rate) * 100) : 0
              const trendIcon = compDiff > 0 ? TrendingUp : compDiff < 0 ? TrendingDown : null
              const trendColor = compDiff >= 0 ? 'text-green-600' : 'text-red-600'
              const trendBg = compDiff >= 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
              if (trendIcon) {
                insights.push({
                  icon: trendIcon,
                  text: `Tendance taux réal. : ${compDiff > 0 ? '+' : ''}${compDiff}% vs période précédente`,
                  color: trendColor,
                  bg: trendBg,
                })
              }
            }

            return insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn('flex items-start gap-3 rounded-lg border p-3', insight.bg)}>
                <div className={cn('mt-0.5 shrink-0', insight.color)}>
                  <insight.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={cn('text-xs font-medium', insight.color)}>{insight.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {i === 0 ? 'Tickets servis / créés' : i === 1 ? 'Non présentés' : 'Comparaison inter-période'}
                  </p>
                </div>
              </div>
            ))
          })()}
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            {t.label}
            {t.id === 'deferred' && advanced && advanced.deferred.total > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-xs font-bold rounded-full">
                {advanced.deferred.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Vue d'ensemble ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPI row 1 */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AnalyticsCard
              title="Tickets créés"
              value={k?.total ?? '—'}
              icon={Ticket}
              change={pk ? mkChange(k?.total ?? 0, pk.total) : undefined}
              description="Total sur la période"
            />
            <AnalyticsCard
              title="Tickets servis"
              value={k?.served ?? '—'}
              icon={CheckCircle2}
              change={pk ? mkChange(k?.served ?? 0, pk.served) : undefined}
              description="Statut : clos"
            />
            <AnalyticsCard
              title="Absences"
              value={k?.absent ?? '—'}
              icon={UserX}
              change={pk ? mkChange(k?.absent ?? 0, pk.absent, true) : undefined}
              description="Non présentés"
            />
            <AnalyticsCard
              title="En file"
              value={k?.active ?? '—'}
              icon={Activity}
              description="Tickets actifs actuellement"
            />
          </div>

          {/* KPI row 2 */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AnalyticsCard
              title="Attente moyenne"
              value={fmtMin(k?.wait_avg_minutes ?? null)}
              icon={Clock}
              description="Création → appel"
            />
            <AnalyticsCard
              title="Durée de service"
              value={fmtMin(k?.service_avg_minutes ?? null)}
              icon={Timer}
              description="Appel → clôture"
            />
            <AnalyticsCard
              title="Taux de réalisation"
              value={k ? `${k.completion_rate}%` : '—'}
              icon={Target}
              change={pk ? mkChange(k?.completion_rate ?? 0, pk.completion_rate) : undefined}
              description="Tickets servis / créés"
            />
            <AnalyticsCard
              title="Tickets reportés"
              value={k?.deferred ?? '—'}
              icon={CalendarClock}
              description="Renvoyés au lendemain"
            />
          </div>

          {/* Indicators row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="bg-card rounded-xl shadow-lg border border-border p-5">
              <div className="text-sm font-medium text-muted-foreground mb-2">Taux d'absentéisme</div>
              <div className="text-3xl font-bold text-foreground">{k ? `${k.absenteeism_rate}%` : '—'}</div>
              {pk && pk.absenteeism_rate > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">Période préc. : {pk.absenteeism_rate}%</div>
              )}
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    (k?.absenteeism_rate ?? 0) > 20 ? 'bg-red-500' : (k?.absenteeism_rate ?? 0) > 10 ? 'bg-amber-500' : 'bg-green-500',
                  )}
                  style={{ width: `${Math.min(k?.absenteeism_rate ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {reviews && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-5">
                <div className="text-sm font-medium text-muted-foreground mb-2">Satisfaction globale</div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-amber-500">{reviews.global_avg?.toFixed(1) ?? '—'}</span>
                  <StarRating value={reviews.global_avg ?? 0} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{reviews.total} avis collectés</div>
              </div>
            )}

            <div className="bg-card rounded-xl shadow-lg border border-border p-5">
              <div className="text-sm font-medium text-muted-foreground mb-2">Services actifs</div>
              <div className="text-3xl font-bold text-foreground">{advanced?.by_service.length ?? '—'}</div>
              <div className="mt-1 text-xs text-muted-foreground">avec activité sur la période</div>
            </div>
          </div>

          {/* Temporal chart */}
          <ChartContainer
            title="Évolution de l'activité"
            description="Tickets créés, servis et absents"
            actions={
              <select
                value={bucket}
                onChange={e => setBucket(e.target.value as 'day' | 'hour')}
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              >
                <option value="day">Par jour</option>
                <option value="hour">Par heure</option>
              </select>
            }
          >
            {seriesLoading ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
            ) : series.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée sur la période</div>
            ) : (
              <AreaChartComponent
                data={series}
                xAxisDataKey="bucket"
                areas={[
                  { dataKey: 'created', stroke: '#3b82f6', fill: '#3b82f6', name: 'Créés', fillOpacity: 0.12 },
                  { dataKey: 'closed', stroke: '#10b981', fill: '#10b981', name: 'Servis', fillOpacity: 0.12 },
                  { dataKey: 'absent', stroke: '#f59e0b', fill: '#f59e0b', name: 'Absents', fillOpacity: 0.12 },
                ]}
                height={280}
              />
            )}
          </ChartContainer>

          {/* Top services table */}
          {advanced && advanced.by_service.length > 0 && (
            <ChartContainer title="Synthèse par service" description="Indicateurs clés sur la période">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Service', 'Total', 'Servis', 'Absents', 'Taux abs.', 'Taux réal.', 'Attente'].map(h => (
                        <th key={h} className="pb-3 text-right text-xs font-medium text-muted-foreground first:text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {advanced.by_service.map(s => (
                      <tr key={s.service_id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-medium text-foreground pr-4">{s.service_name}</td>
                        <td className="py-3 text-right font-bold text-foreground">{s.total}</td>
                        <td className="py-3 text-right text-green-600 font-medium">{s.served}</td>
                        <td className="py-3 text-right text-amber-600">{s.absent}</td>
                        <td className="py-3 text-right"><RateBadge rate={s.absenteeism_rate} /></td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-semibold',
                            s.completion_rate >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : s.completion_rate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          )}>
                            {s.completion_rate}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{fmtMin(s.wait_avg_minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartContainer>
          )}
        </div>
      )}

      {/* ── Tab: Par service ── */}
      {tab === 'services' && (
        <div className="space-y-4">
          {!advanced || advanced.by_service.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {advancedLoading ? 'Chargement…' : 'Aucune donnée sur la période sélectionnée'}
            </div>
          ) : (
            <>
              <ChartContainer
                title="Analyse détaillée par service"
                description={`${advanced.by_service.length} service(s) actif(s) sur la période`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Service', 'Total', 'Servis', 'Absents', 'Reportés', 'Taux abs.', 'Taux réal.', 'Attente moy.', 'Priorités'].map(h => (
                          <th key={h} className="pb-3 text-right text-xs font-medium text-muted-foreground first:text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {advanced.by_service.map(s => (
                        <tr key={s.service_id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 font-semibold text-foreground pr-4 min-w-[140px]">{s.service_name}</td>
                          <td className="py-3 text-right font-bold text-foreground">{s.total}</td>
                          <td className="py-3 text-right text-green-600 font-medium">{s.served}</td>
                          <td className="py-3 text-right text-amber-600">{s.absent}</td>
                          <td className="py-3 text-right text-blue-500">{s.deferred}</td>
                          <td className="py-3 text-right"><RateBadge rate={s.absenteeism_rate} /></td>
                          <td className="py-3 text-right">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-semibold',
                              s.completion_rate >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : s.completion_rate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                            )}>
                              {s.completion_rate}%
                            </span>
                          </td>
                          <td className="py-3 text-right text-muted-foreground">{fmtMin(s.wait_avg_minutes)}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {s.priority.urgence > 0 && (
                                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                                  {s.priority.urgence}
                                </span>
                              )}
                              {s.priority.vip > 0 && (
                                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[9px] flex items-center justify-center font-bold">
                                  {s.priority.vip}
                                </span>
                              )}
                              {s.priority.high > 0 && (
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                                  {s.priority.high}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartContainer>

              {/* Source breakdown per service */}
              <ChartContainer title="Sources par service" description="Canal d'origine des tickets par service">
                <div className="space-y-3">
                  {advanced.by_service.map(s => {
                    const srcTotal = s.source.app + s.source.qr_scan + s.source.agent + s.source.kiosk
                    if (srcTotal === 0) return null
                    return (
                      <div key={s.service_id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{s.service_name}</span>
                          <span className="text-xs text-muted-foreground">{srcTotal} tickets</span>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden gap-px">
                          {([
                            ['app', s.source.app, '#3b82f6'],
                            ['qr_scan', s.source.qr_scan, '#10b981'],
                            ['agent', s.source.agent, '#f59e0b'],
                            ['kiosk', s.source.kiosk, '#8b5cf6'],
                          ] as [string, number, string][])
                            .filter(([, v]) => v > 0)
                            .map(([src, v, color]) => (
                              <div
                                key={src}
                                title={`${SOURCE_LABELS[src]}: ${v}`}
                                style={{ width: `${(v / srcTotal) * 100}%`, backgroundColor: color }}
                              />
                            ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[key] }} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </ChartContainer>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Analyse tickets ── */}
      {tab === 'tickets' && (
        <div className="space-y-6">
          {!advanced ? (
            <div className="text-center py-16 text-muted-foreground">{advancedLoading ? 'Chargement…' : 'Aucune donnée'}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Priority donut */}
                <ChartContainer title="Répartition par priorité" description="Distribution des tickets">
                  <DonutChart
                    data={advanced.by_priority.filter(p => p.total > 0).map(p => ({
                      name: PRIORITY_LABELS[p.priority] ?? p.priority,
                      value: p.total,
                      color: PRIORITY_COLORS[p.priority] ?? '#6b7280',
                    }))}
                    height={200}
                    innerRadius={55}
                    outerRadius={80}
                  />
                  <div className="mt-4 space-y-2.5">
                    {advanced.by_priority.map(p => (
                      <div key={p.priority} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[p.priority] ?? '#6b7280' }} />
                          <span className="text-muted-foreground">{PRIORITY_LABELS[p.priority] ?? p.priority}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">{p.total}</span>
                          <span className="text-muted-foreground text-xs w-14 text-right">{fmtMin(p.wait_avg_minutes)}</span>
                          <RateBadge rate={p.absenteeism_rate} label="abs." />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartContainer>

                {/* Source donut */}
                <ChartContainer title="Répartition par source" description="Canal d'origine des tickets">
                  <DonutChart
                    data={advanced.by_source.filter(s => s.total > 0).map(s => ({
                      name: SOURCE_LABELS[s.source] ?? s.source,
                      value: s.total,
                      color: SOURCE_COLORS[s.source] ?? '#6b7280',
                    }))}
                    height={200}
                    innerRadius={55}
                    outerRadius={80}
                  />
                  <div className="mt-4 space-y-2.5">
                    {advanced.by_source.map(s => (
                      <div key={s.source} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[s.source] ?? '#6b7280' }} />
                          <span className="text-muted-foreground">{SOURCE_LABELS[s.source] ?? s.source}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">{s.total}</span>
                          <span className="text-xs text-green-600">{s.served} servis</span>
                          <RateBadge rate={s.absenteeism_rate} label="abs." />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartContainer>
              </div>

              {/* Priority bar chart */}
              {advanced.by_priority.some(p => p.total > 0) && (
                <ChartContainer title="Volume par priorité" description="Nombre de tickets par niveau">
                  <VerticalBarChart
                    data={advanced.by_priority.filter(p => p.total > 0).map(p => ({
                      name: PRIORITY_LABELS[p.priority] ?? p.priority,
                      value: p.total,
                      color: PRIORITY_COLORS[p.priority] ?? '#6b7280',
                    }))}
                    height={240}
                    showLabels
                  />
                </ChartContainer>
              )}

              {/* Source bar chart */}
              {advanced.by_source.some(s => s.total > 0) && (
                <ChartContainer title="Volume par source" description="Tickets créés par canal">
                  <VerticalBarChart
                    data={advanced.by_source.filter(s => s.total > 0).map(s => ({
                      name: SOURCE_LABELS[s.source] ?? s.source,
                      value: s.total,
                      color: SOURCE_COLORS[s.source] ?? '#6b7280',
                    }))}
                    height={240}
                    showLabels
                  />
                </ChartContainer>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Activité temporelle ── */}
      {tab === 'temporal' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={bucket}
              onChange={e => setBucket(e.target.value as 'day' | 'hour')}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="day">Par jour</option>
              <option value="hour">Par heure de création</option>
            </select>

            {advanced && advanced.by_service.length > 0 && (
              <select
                value={seriesServiceId}
                onChange={e => setSeriesServiceId(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Tous les services</option>
                {advanced.by_service.map(s => (
                  <option key={s.service_id} value={String(s.service_id)}>
                    {s.service_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Temporal chart */}
          <ChartContainer title="Évolution temporelle" description="Tickets créés, servis et absents">
            {seriesLoading ? (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
            ) : series.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée sur la période</div>
            ) : (
              <AreaChartComponent
                data={series}
                xAxisDataKey="bucket"
                areas={[
                  { dataKey: 'created', stroke: '#3b82f6', fill: '#3b82f6', name: 'Créés', fillOpacity: 0.12 },
                  { dataKey: 'closed', stroke: '#10b981', fill: '#10b981', name: 'Servis', fillOpacity: 0.12 },
                  { dataKey: 'absent', stroke: '#f59e0b', fill: '#f59e0b', name: 'Absents', fillOpacity: 0.12 },
                ]}
                height={300}
              />
            )}
          </ChartContainer>

          {/* Hourly distribution */}
          {advanced && (
            <ChartContainer title="Distribution horaire" description="Volume de tickets par heure de la journée sur la période">
              <AreaChartComponent
                data={hourlyData}
                xAxisDataKey="bucket"
                areas={[
                  { dataKey: 'total', stroke: '#f59e0b', fill: '#f59e0b', name: 'Tickets', fillOpacity: 0.3 },
                ]}
                height={240}
              />

              {advanced.by_hour.some(h => h.peak) && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">Heures de pointe :</span>
                  {advanced.by_hour.filter(h => h.peak).map(h => (
                    <span
                      key={h.hour}
                      className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold rounded-full"
                    >
                      {String(h.hour).padStart(2, '0')}h ({h.total})
                    </span>
                  ))}
                </div>
              )}
            </ChartContainer>
          )}
        </div>
      )}

      {/* ── Tab: Reportés ── */}
      {tab === 'deferred' && (
        <div className="space-y-6">
          {!advanced ? (
            <div className="text-center py-16 text-muted-foreground">{advancedLoading ? 'Chargement…' : 'Aucune donnée'}</div>
          ) : (
            <>
              {/* Deferred KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <AnalyticsCard
                  title="Tickets reportés"
                  value={advanced.deferred.total}
                  icon={CalendarClock}
                  description="Créés dans la période sélectionnée"
                />
                <AnalyticsCard
                  title="Charge prévisionnelle"
                  value={advanced.deferred.upcoming_load.reduce((s, d) => s + d.count, 0)}
                  icon={CalendarDays}
                  description="Reportés à traiter (14 prochains jours)"
                />
                <div className="bg-card rounded-xl shadow-lg border border-border p-5">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Raison principale</div>
                  <div className="text-lg font-bold text-foreground leading-tight">
                    {(() => {
                      const top = advanced.deferred.by_reason.reduce(
                        (a, b) => b.count > a.count ? b : a,
                        { reason: '', count: 0 },
                      )
                      return top.count > 0 ? (DEFER_REASON_LABELS[top.reason] ?? top.reason) : '—'
                    })()}
                  </div>
                </div>
              </div>

              {/* Reason breakdown */}
              {advanced.deferred.by_reason.some(r => r.count > 0) ? (
                <ChartContainer title="Motifs de report" description="Répartition des raisons de déférement">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <DonutChart
                      data={advanced.deferred.by_reason.filter(r => r.count > 0).map(r => ({
                        name: DEFER_REASON_LABELS[r.reason] ?? r.reason,
                        value: r.count,
                        color: DEFER_REASON_COLORS[r.reason] ?? '#6b7280',
                      }))}
                      height={220}
                      innerRadius={55}
                      outerRadius={85}
                    />
                    <div className="space-y-3 flex flex-col justify-center">
                      {advanced.deferred.by_reason.filter(r => r.count > 0).map(r => (
                        <div key={r.reason} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: DEFER_REASON_COLORS[r.reason] ?? '#6b7280' }} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-foreground">{DEFER_REASON_LABELS[r.reason] ?? r.reason}</span>
                              <span className="text-sm font-bold text-foreground">{r.count}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${advanced.deferred.total > 0 ? Math.round((r.count / advanced.deferred.total) * 100) : 0}%`,
                                  backgroundColor: DEFER_REASON_COLORS[r.reason] ?? '#6b7280',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">Aucun ticket reporté sur la période sélectionnée</div>
              )}

              {/* Upcoming load chart */}
              {advanced.deferred.upcoming_load.length > 0 && (
                <ChartContainer
                  title="Charge prévisionnelle"
                  description="Tickets reportés à traiter dans les prochains jours"
                >
                  <AreaChartComponent
                    data={advanced.deferred.upcoming_load.map(d => ({
                      bucket: fmtDate(d.date),
                      count: d.count,
                    }))}
                    xAxisDataKey="bucket"
                    areas={[
                      { dataKey: 'count', stroke: '#f59e0b', fill: '#f59e0b', name: 'Tickets reportés', fillOpacity: 0.3 },
                    ]}
                    height={260}
                  />
                </ChartContainer>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Évaluations ── */}
      {tab === 'reviews' && (
        <div className="space-y-6">
          {reviews === null ? (
            <div className="text-center py-16 text-muted-foreground">Chargement…</div>
          ) : reviews.total === 0 ? (
            <div className="text-center py-16 text-muted-foreground">Aucune évaluation pour l'instant.</div>
          ) : (
            <>
              {/* Reviews KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Note globale</div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-amber-500">{reviews.global_avg?.toFixed(1) ?? '—'}</span>
                    <StarRating value={reviews.global_avg ?? 0} />
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Évaluations reçues</div>
                  <div className="text-3xl font-bold text-foreground">{reviews.total}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Services évalués</div>
                  <div className="text-3xl font-bold text-foreground">{reviews.services.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Distribution */}
                <ChartContainer title="Distribution des notes">
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(star => {
                      const entry = reviews.distribution.find(d => d.rating === star)
                      const count = entry?.count ?? 0
                      const pct = reviews.total > 0 ? Math.round((count / reviews.total) * 100) : 0
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-9 shrink-0">
                            <span className="text-sm font-medium">{star}</span>
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          </div>
                          <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground w-20 text-right">
                            {count} ({pct}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </ChartContainer>

                {/* Note par service */}
                {reviews.services.length > 0 && (
                  <ChartContainer title="Note par service">
                    <div className="space-y-1">
                      {reviews.services.map(s => (
                        <div key={s.service_id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                          <div>
                            <div className="text-sm font-medium text-foreground">{s.service_name}</div>
                            <div className="text-xs text-muted-foreground">{s.total} avis</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-amber-500">{s.avg_rating.toFixed(1)}</span>
                            <StarRating value={s.avg_rating} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartContainer>
                )}
              </div>

              {/* Evolution */}
              {reviews.evolution.length > 0 && (
                <ChartContainer title="Évolution de la satisfaction" description="Note moyenne sur 30 jours">
                  <LineChartComponent
                    data={reviews.evolution}
                    xAxisDataKey="date"
                    lines={[{ dataKey: 'avg_rating', stroke: '#f59e0b', name: 'Note moy.' }]}
                    height={240}
                  />
                </ChartContainer>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
