/**
 * Statistiques (Admin)
 * - Vue d'ensemble (overview) et statistiques par service.
 * - Évaluations des services (notes, distribution, évolution).
 */
import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

// Affiche N étoiles pleines/vides
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < Math.round(value) ? 'text-amber-400' : 'text-muted-foreground/30'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export default function Stats() {
  const [overview, setOverview] = useState<any>(null)
  const [serviceId, setServiceId] = useState<number | ''>('' as any)
  const [serviceStats, setServiceStats] = useState<any>(null)
  const [bucket, setBucket] = useState<'day' | 'hour'>('day')
  const [series, setSeries] = useState<any[]>([])
  const [isSeriesLoading, setIsSeriesLoading] = useState(false)
  const [seriesError, setSeriesError] = useState<string>('')
  const [reviews, setReviews] = useState<any>(null)

  useEffect(() => { api.get('/api/admin/stats/overview').then(r => setOverview(r.data)).catch(() => setOverview(null)) }, [])
  useEffect(() => {
    api.get('/api/admin/reviews/stats').then(r => setReviews(r.data)).catch(() => setReviews(null))
  }, [])

  useEffect(() => {
    if (!serviceId) { setServiceStats(null); return }
    api.get(`/api/admin/stats/services/${serviceId}`).then(r => setServiceStats(r.data)).catch(() => setServiceStats(null))
  }, [serviceId])

  useEffect(() => {
    setIsSeriesLoading(true)
    setSeriesError('')
    const params: any = { bucket }
    if (serviceId) params.service_id = serviceId
    api.get('/api/admin/stats/series', { params })
      .then((r) => {
        setSeries(Array.isArray(r.data?.series) ? r.data.series : [])
        setIsSeriesLoading(false)
      })
      .catch((e) => {
        setSeries([])
        setIsSeriesLoading(false)
        setSeriesError(e?.message || 'Erreur lors du chargement de la série')
      })
  }, [bucket, serviceId])

  const totalReviews: number = reviews?.total ?? 0
  const globalAvg: number | null = reviews?.global_avg ?? null
  const distribution: { rating: number; count: number }[] = reviews?.distribution ?? []
  const evolution: { date: string; avg_rating: number; count: number }[] = reviews?.evolution ?? []
  const serviceReviews: { service_id: number; service_name: string; avg_rating: number; total: number }[] = reviews?.services ?? []

  return (
    <div className="space-y-4">
      {/* KPI tickets */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Créés</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.created ?? '—'}</div>
        </div>
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Clos</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.closed ?? '—'}</div>
        </div>
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Absents</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.absent ?? '—'}</div>
        </div>
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Attente moyenne</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.wait_avg_minutes ?? '—'} min</div>
        </div>
      </div>

      {/* Statistiques par service (activité) */}
      <div className="bg-card rounded-xl shadow-lg border border-border p-6">
        <div className="text-lg font-semibold text-foreground mb-4">Statistiques par service</div>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input className="w-40 rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={serviceId as any} onChange={e => setServiceId(Number(e.target.value) || '' as any)} placeholder="Service ID" />
            <select className="w-40 rounded-md border-border bg-background px-3 py-2 text-sm" value={bucket} onChange={e => setBucket(e.target.value as any)}>
              <option value="day">Par jour</option>
              <option value="hour">Par heure</option>
            </select>
          </div>
          {serviceStats && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-card rounded-xl shadow-lg border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Créés</div>
                <div className="text-2xl font-bold text-foreground">{serviceStats.tickets?.created ?? '—'}</div>
              </div>
              <div className="bg-card rounded-xl shadow-lg border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Clos</div>
                <div className="text-2xl font-bold text-foreground">{serviceStats.tickets?.closed ?? '—'}</div>
              </div>
              <div className="bg-card rounded-xl shadow-lg border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Absents</div>
                <div className="text-2xl font-bold text-foreground">{serviceStats.tickets?.absent ?? '—'}</div>
              </div>
            </div>
          )}
          <div className="mt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Évolution (créés / clos / absents)</div>
            <div className="h-72">
              {isSeriesLoading ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
              ) : seriesError ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-destructive">{seriesError}</div>
              ) : series.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée sur la période</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={false} name="Créés" />
                    <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} dot={false} name="Clos" />
                    <Line type="monotone" dataKey="absent" stroke="#f59e0b" strokeWidth={2} dot={false} name="Absents" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Évaluations des services ─── */}
      <div className="bg-card rounded-xl shadow-lg border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="text-lg font-semibold text-foreground">Évaluations des services</div>
        </div>

        {reviews === null ? (
          <div className="text-sm text-muted-foreground">Chargement…</div>
        ) : totalReviews === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune évaluation pour l'instant.</div>
        ) : (
          <>
            {/* KPI évaluations */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Note globale</div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-amber-500">{globalAvg?.toFixed(1) ?? '—'}</span>
                  <StarRating value={globalAvg ?? 0} />
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Évaluations reçues</div>
                <div className="text-3xl font-bold text-foreground">{totalReviews}</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Services évalués</div>
                <div className="text-3xl font-bold text-foreground">{serviceReviews.length}</div>
              </div>
            </div>

            {/* Distribution des notes */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-3">Distribution des notes</div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const entry = distribution.find(d => d.rating === star)
                  const count = entry?.count ?? 0
                  const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-10 shrink-0">
                        <span className="text-sm font-medium text-foreground">{star}</span>
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Note par service */}
            {serviceReviews.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">Note moyenne par service</div>
                <div className="space-y-2">
                  {serviceReviews.map((s) => (
                    <div key={s.service_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{s.service_name}</span>
                        <span className="text-xs text-muted-foreground">({s.total} avis)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-amber-500">{s.avg_rating.toFixed(1)}</span>
                        <StarRating value={s.avg_rating} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Évolution de la note moyenne (30 jours) */}
            {evolution.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Évolution de la note (30 derniers jours)</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [Number(v).toFixed(2), 'Note moy.']} />
                      <Line type="monotone" dataKey="avg_rating" stroke="#f59e0b" strokeWidth={2} dot={false} name="Note moy." />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
