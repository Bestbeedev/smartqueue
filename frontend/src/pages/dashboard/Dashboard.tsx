import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/axios'
import { useAppSelector } from '@/store'
import { toast } from 'sonner'
import { PieChart as PieChartIcon } from 'lucide-react'
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
  const [services, setServices] = useState<any[]>([])
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([])
  const [agentsDistribution, setAgentsDistribution] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [servicesLoading, setServicesLoading] = useState(false)
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

  const loadServices = async () => {
    if (servicesLoading || !user?.establishment_id) return
    setServicesLoading(true)
    try {
      // Charger les services de l'établissement
      const servicesResponse = await api.get(`/api/establishments/${user.establishment_id}/services`, {
        params: { per_page: 50, status: 'open' }
      })
      const servicesData = servicesResponse.data.data || servicesResponse.data || []
      setServices(servicesData)

      // Préparer les données pour les graphiques
      prepareServicesCharts(servicesData)
    } catch (error: any) {
      console.error('Erreur lors du chargement des services:', error)
      setServices([])
      setServiceDistribution([])
      setAgentsDistribution([])
    } finally {
      setServicesLoading(false)
    }
  }

  const prepareServicesCharts = async (servicesData: any[]) => {
    try {
      // Distribution des tickets par service
      const distribution = servicesData.map((service: any) => ({
        name: service.name,
        value: service.people_waiting || 0
      })).filter((item: any) => item.value > 0)

      setServiceDistribution(distribution)

      // Distribution des agents par service (basé sur la donnée API si fournie)
      const agentsDist = servicesData
        .map((service: any) => ({
          name: service.name,
          value: Number(service.agents_count ?? 0),
          color: '#3b82f6',
        }))
        .filter((row: any) => Number(row.value) > 0)
      setAgentsDistribution(agentsDist)

      // Évolution des tickets sur 24h: pas d'endpoint réel ici, on la dérive de /api/admin/stats/series si possible
      // (La vraie série est déjà chargée dans `series` / `lineData`, donc on laisse `ticketsEvolution` vide)

      // Charger les recommandations pour le premier service
      if (servicesData.length > 0) {
        const firstService = servicesData[0]
        try {
          const recommendationsResponse = await api.get(`/api/services/${firstService.id}/recommendations`)
          setRecommendations(recommendationsResponse.data.windows || [])
        } catch (error) {
          setRecommendations([])
        }
      }
    } catch (error) {
      console.error('Erreur lors de la préparation des graphiques:', error)
    }
  }

  useEffect(() => {
    loadStats()
    loadSeries()
    loadServices()
  }, [role, from, to, user?.establishment_id])

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
          {/* Services Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Services Actifs"
              value={stats?.services?.active || 0}
              icon={Activity}
              change={{ value: 12, type: 'increase' }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
            />
            <AnalyticsCard
              title="Total Agents"
              value={stats?.services?.agents || 0}
              icon={Users}
              change={{ value: 5, type: 'increase' }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            />
            <AnalyticsCard
              title="Tickets en Attente"
              value={stats?.services?.waiting || 0}
              icon={Clock}
              change={{ value: 8, type: 'decrease' }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
            />
            <AnalyticsCard
              title="Temps Moyen"
              value={`${stats?.services?.avgTime || 0}min`}
              icon={TrendingUp}
              change={{ value: 2, type: 'decrease' }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            />
          </div>

          {/* Services Table with Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Services List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Services de l'établissement
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    Voir tout
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services?.map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${service.status === 'open' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <h4 className="font-semibold">{service.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {service.agents_count || 0} agents
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.avg_service_time_minutes}min
                              </span>
                              <span className="flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                {service.people_waiting || 0} en attente
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={service.status === 'open' ? 'default' : 'secondary'}>
                            {service.status === 'open' ? 'Ouvert' : 'Fermé'}
                          </Badge>
                          {service.priority_support && (
                            <Badge variant="outline" className="border-orange-500 text-orange-500">
                              Prioritaire
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Distribution Chart */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Distribution des tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    title="Répartition des Services"
                    config={{
                      tickets: {
                        label: "Tickets",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    {serviceDistribution.length > 0 ? (
                      <DonutChart
                        data={serviceDistribution.map((d: any, index: number) => ({
                          name: String(d.name ?? ''),
                          value: Number(d.value ?? 0),
                          color: `hsl(var(--chart-${index + 1}))`,
                        }))}
                        height={300}
                      />
                    ) : (
                      <div className="h-[300px] w-full flex items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée.
                      </div>
                    )}
                  </ChartContainer>
                  <div className="mt-4 space-y-2">
                    {serviceDistribution.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-chart-${index + 1}`} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Agents Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Répartition des Agents par Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                title="Répartition des Agents par Service"
                className="h-[300px]"
              >
                {agentsDistribution.length > 0 ? (
                  <VerticalBarChart data={agentsDistribution as any} height={300} />
                ) : (
                  <div className="h-[300px] w-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée.
                  </div>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Time-based Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Évolution des tickets (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {hasSeriesData ? (
                    <LineChartComponent
                      data={lineData}
                      lines={[{ dataKey: 'tickets', name: 'Tickets', stroke: '#3b82f6' }]}
                      height={250}
                      xAxisDataKey="date"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                      Aucune donnée.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recommandations horaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(recommendations) && recommendations.length > 0 ? (
                    recommendations.map((rec: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <div>
                            <p className="font-medium">{rec.start} - {rec.end}</p>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Faible affluence
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="h-[120px] w-full flex items-center justify-center text-sm text-muted-foreground">
                      Aucune donnée.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Activités récentes et métriques : supprimées (données mock). À réactiver quand API réelle disponible. */}
    </div>
  )
}
