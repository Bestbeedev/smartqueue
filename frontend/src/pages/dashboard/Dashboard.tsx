import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/axios'
import { useAppSelector } from '@/store'
import { toast } from 'sonner'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { 
  Ticket, 
  CheckCircle, 
  UserX, 
  Clock, 
  Users, 
  Building2, 
  Activity, 
  TrendingUp,
  Calendar as CalendarIcon,
  Bell,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { AnalyticsCard } from '@/components/ui/analytics-card'
import { ChartContainer } from '@/components/ui/chart-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DonutChart, LineChartComponent, VerticalBarChart } from '@/components/ui/charts'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const role = useAppSelector((s) => s.auth.user?.role)
  const user = useAppSelector((s) => s.auth.user)

  const { from, to } = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    if (timeRange === 'day') {
      start.setDate(end.getDate() - 1)
    } else if (timeRange === 'week') {
      start.setDate(end.getDate() - 7)
    } else {
      start.setMonth(end.getMonth() - 1)
    }

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    }
  }, [timeRange])

  const loadStats = async () => {
    if (loading) return
    if (role !== 'admin') return
    
    setLoading(true)
    try {
      const response = await api.get('/api/admin/stats/overview', {
        params: { from, to },
      })
      setStats(response.data)
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Accès refusé. Permissions administrateur requises.')
      } else if (status === 404) {
        toast.error('Endpoint non trouvé. Vérifiez l\'API.')
      } else if (status >= 500) {
        toast.error('Erreur serveur. Contactez l\'administrateur.')
      } else {
        toast.error('Impossible de charger les statistiques')
      }
      console.error('Erreur lors du chargement des statistiques:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const loadSeries = async () => {
    if (role !== 'admin') return
    setSeriesLoading(true)
    try {
      const response = await api.get('/api/admin/stats/series', {
        params: { from, to, bucket: 'day' },
      })
      setSeries(Array.isArray(response.data?.series) ? response.data.series : [])
    } catch (error: any) {
      console.error('Erreur lors du chargement de la série:', error)
      setSeries([])
    } finally {
      setSeriesLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadSeries()
  }, [role, from, to])

  const lineData = useMemo(() => {
    if (!Array.isArray(series) || series.length === 0) return []

    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    return series
      .map((row: any) => {
        const raw = row?.bucket
        const bucket = typeof raw === 'string' ? raw : raw ? String(raw) : ''
        const d = new Date(bucket)
        if (!bucket || isNaN(d.getTime())) return null

        return {
          date: bucket,
          name: days[d.getDay()],
          tickets: Number(row.created ?? 0),
          resolved: Number(row.closed ?? 0),
          absent: Number(row.absent ?? 0),
        }
      })
      .filter(Boolean) as any[]
  }, [series])

  const hasSeriesData = useMemo(() => {
    if (!Array.isArray(lineData) || lineData.length === 0) return false
    return lineData.some((r: any) => Number(r?.tickets ?? 0) > 0 || Number(r?.resolved ?? 0) > 0 || Number(r?.absent ?? 0) > 0)
  }, [lineData])

  const pieData = useMemo(() => {
    const created = Number(stats?.tickets?.created ?? 0)
    const closed = Number(stats?.tickets?.closed ?? 0)
    const absent = Number(stats?.tickets?.absent ?? 0)
    const pending = Math.max(created - closed - absent, 0)
    const total = created > 0 ? created : closed + absent + pending

    const toPercent = (v: number) => {
      if (total <= 0) return 0
      return Math.round((v / total) * 100)
    }

    return [
      { name: 'En attente', value: toPercent(pending), color: '#3b82f6' },
      { name: 'Résolus', value: toPercent(closed), color: '#10b981' },
      { name: 'Absents', value: toPercent(absent), color: '#f59e0b' },
    ]
  }, [stats])

  const donutData = useMemo(() => {
    return pieData.map((p) => ({ name: p.name, value: p.value, color: p.color }))
  }, [pieData])

  const hasDonutData = useMemo(() => {
    return donutData.some((d) => Number(d.value) > 0)
  }, [donutData])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground transition-colors duration-300">
            Tableau de bord
          </h1>
          <p className="mt-2 text-muted-foreground transition-colors duration-300">
            Bienvenue {user?.name}, voici un aperçu de vos performances
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border p-1 bg-card transition-all duration-300">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300",
                  timeRange === range
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {range === 'day' ? 'Aujourd\'hui' : range === 'week' ? 'Cette semaine' : 'Ce mois'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue générale</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard
              title="Tickets créés"
              value={stats?.tickets?.created ?? '—'}
              change={{ value: 12, type: 'increase' }}
              icon={Ticket}
              description="Nouveaux tickets cette période"
            />
            <AnalyticsCard
              title="Tickets résolus"
              value={stats?.tickets?.closed ?? '—'}
              change={{ value: 8, type: 'increase' }}
              icon={CheckCircle}
              description="Tickets traités avec succès"
            />
            <AnalyticsCard
              title="Temps d'attente moyen"
              value={stats?.tickets?.wait_avg_minutes ? `${stats.tickets.wait_avg_minutes} min` : '—'}
              change={{ value: 15, type: 'decrease' }}
              icon={Clock}
              description="Temps moyen de traitement"
            />
            <AnalyticsCard
              title="Taux de satisfaction"
              value="94%"
              change={{ value: 3, type: 'increase' }}
              icon={TrendingUp}
              description="Satisfaction client moyenne"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ChartContainer
              title="Activité des tickets"
              description="Évolution des tickets créés / résolus / absents"
            >
              <div className="h-[300px]">
                {seriesLoading ? (
                  <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
                ) : !hasSeriesData ? (
                  <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée pour la période sélectionnée.
                  </div>
                ) : (
                  <LineChartComponent
                    data={lineData}
                    lines={[
                      { dataKey: 'tickets', name: 'Tickets créés', stroke: '#3b82f6' },
                      { dataKey: 'resolved', name: 'Tickets résolus', stroke: '#10b981' },
                      { dataKey: 'absent', name: 'Absents', stroke: '#f59e0b' },
                    ]}
                    xAxisDataKey="date"
                  />
                )}
              </div>
            </ChartContainer>

            <ChartContainer
              title="Répartition des tickets"
              description="Répartition par statut (en attendant la distribution par service)"
            >
            
              {hasDonutData ? (
                <DonutChart data={donutData} />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée pour la période sélectionnée.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-muted-foreground transition-colors duration-300">{item.name}</span>
                    <span className="text-sm font-bold ml-auto text-foreground transition-colors duration-300">{item.value}%</span>
                  </div>
                ))}
              </div>
            </ChartContainer>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <ChartContainer
            title="Évolution des tickets"
            description="Données réelles de la base (série temporelle)"
            actions={
              <Button variant="outline" size="sm" className="hover:bg-accent" onClick={() => { loadStats(); loadSeries(); }}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            }
          >
            <div className="h-[320px]">
              {seriesLoading ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
              ) : !hasSeriesData ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée pour la période sélectionnée.
                </div>
              ) : (
                <VerticalBarChart
                  data={lineData.map((r: any) => ({
                    name: String(r.name ?? ''),
                    value: Number(r.tickets ?? 0),
                    color: '#3b82f6',
                  }))}
                />
              )}
            </div>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution par service</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cette section sera reliée aux données réelles dès qu’on ajoute un endpoint backend du type
              <span className="font-mono"> GET /api/admin/stats/service-distribution</span>.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activités récentes et métriques : supprimées (données mock). À réactiver quand API réelle disponible. */}
    </div>
  )
}
