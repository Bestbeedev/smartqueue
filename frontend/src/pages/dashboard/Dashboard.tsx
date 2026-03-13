import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/axios'
import { useAppSelector } from '@/store'
import { toast } from 'sonner'
import { 
  Ticket, 
  CheckCircle, 
  UserX,
  PieChartIcon, 
  Clock, 
  Users, 
  Building2, 
  Activity, 
  TrendingUp,
  Calendar as CalendarIcon,
  Bell,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  UserPlus,
  Settings,
  Mail,
  Phone,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Download
} from 'lucide-react'
import { AnalyticsCard } from '@/components/ui/analytics-card'
import { ChartContainer } from '@/components/ui/chart-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DonutChart, LineChartComponent, VerticalBarChart } from '@/components/ui/charts'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

export default function Dashboard() {
  const navigate = useNavigate()
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
  
  // Nouveaux états pour les fonctionnalités supplémentaires
  const [agents, setAgents] = useState<any[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [serviceStats, setServiceStats] = useState<Record<number, any>>({})
  const [activeTab, setActiveTab] = useState('overview')
  
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

      // Charger les stats pour chaque service
      servicesData.forEach(async (service) => {
        try {
          const statsRes = await api.get(`/api/admin/stats/services/${service.id}`, {
            params: { from, to }
          })
          setServiceStats(prev => ({
            ...prev,
            [service.id]: statsRes.data
          }))
        } catch (e) {
          console.warn(`Erreur chargement stats service ${service.id}:`, e)
        }
      })

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

  // Charger les agents
  const loadAgents = async () => {
    if (role !== 'admin' || !user?.establishment_id) return
    setAgentsLoading(true)
    try {
      const { data } = await api.get('/api/admin/agents', {
        params: { per_page: 50 }
      })
      const agentsData = data.data || data || []
      setAgents(agentsData)
    } catch (error) {
      console.error('Erreur chargement agents:', error)
      setAgents([])
    } finally {
      setAgentsLoading(false)
    }
  }

  // Charger les tickets récents
  const loadRecentTickets = async () => {
    if (role !== 'admin') return
    setTicketsLoading(true)
    try {
      const { data } = await api.get('/api/admin/tickets', {
        params: { per_page: 10, sort: '-created_at' }
      })
      const ticketsData = data.data || data || []
      setRecentTickets(ticketsData)
    } catch (error) {
      console.error('Erreur chargement tickets:', error)
      setRecentTickets([])
    } finally {
      setTicketsLoading(false)
    }
  }

  // Charger les notifications récentes
  const loadNotifications = async () => {
    if (role !== 'admin') return
    setNotificationsLoading(true)
    try {
      const { data } = await api.get('/api/notifications', {
        params: { per_page: 5 }
      })
      const notifData = data.data || data || []
      setNotifications(notifData)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  const refreshAll = () => {
    loadStats()
    loadSeries()
    loadServices()
    loadAgents()
    loadRecentTickets()
    loadNotifications()
  }

  useEffect(() => {
    loadStats()
    loadSeries()
    loadServices()
    loadAgents()
    loadRecentTickets()
    loadNotifications()
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAll}
            className="hidden sm:flex"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
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

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="overview">Vue générale</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="activity" className="hidden lg:flex">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/dashboard/queues')} size="sm">
              <Ticket className="h-4 w-4 mr-2" />
              Nouveau Ticket
            </Button>
            <Button onClick={() => navigate('/dashboard/agents')} variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter Agent
            </Button>
            <Button onClick={() => navigate('/dashboard/services')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Service
            </Button>
            <Button onClick={() => navigate('/dashboard/push-broadcast')} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Notification
            </Button>
          </div>
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

          {/* Section inférieure: Tickets récents et Activité */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tickets récents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Tickets récents
                  </CardTitle>
                  <CardDescription>Les 10 derniers tickets créés</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/tickets')}>
                  Voir tout
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : recentTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucun ticket récent</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N°</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTickets.slice(0, 5).map((ticket: any) => (
                        <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}>
                          <TableCell className="font-medium">#{ticket.id}</TableCell>
                          <TableCell>
                            <Badge variant={
                              ticket.status === 'waiting' ? 'secondary' :
                              ticket.status === 'called' ? 'default' :
                              ticket.status === 'closed' ? 'outline' : 'destructive'
                            }>
                              {ticket.status === 'waiting' ? 'En attente' :
                               ticket.status === 'called' ? 'Appelé' :
                               ticket.status === 'closed' ? 'Clôturé' : 'Absent'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {ticket.service?.name || ticket.service_name || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Flux d'activité / Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Activité récente
                  </CardTitle>
                  <CardDescription>Notifications et événements récents</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/notifications')}>
                  Voir tout
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucune activité récente</div>
                ) : (
                  <div className="space-y-4">
                    {notifications.slice(0, 5).map((notif: any) => (
                      <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/dashboard/notifications')}>
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          notif.data?.type === 'error' || notif.type === 'error' ? "bg-red-500" :
                          notif.data?.type === 'warning' || notif.type === 'warning' ? "bg-orange-500" :
                          notif.data?.type === 'success' || notif.type === 'success' ? "bg-green-500" : "bg-blue-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {notif.data?.title || notif.data?.subject || 'Notification'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notif.data?.message || notif.data?.body || ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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

        {/* Onglet Agents - Simplifié */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agents de l'établissement
                </CardTitle>
                <CardDescription>{agents.length} agents actifs</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/dashboard/agents')}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Gérer les agents
              </Button>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Aucun agent</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent: any) => (
                    <div key={agent.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {agent.name?.charAt(0)?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{agent.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{agent.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {agent.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(agent.services || []).length} service(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Répartition rapide */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Actifs</span>
                    <span className="font-medium">{agents.filter((a: any) => a.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inactifs</span>
                    <span className="font-medium">{agents.filter((a: any) => a.status !== 'active').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Services couverts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{services.length}</p>
                <p className="text-sm text-muted-foreground">services avec agents assignés</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Activité */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tous les tickets récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Tous les tickets récents
                </CardTitle>
                <CardDescription>Les 20 derniers tickets de l'établissement</CardDescription>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : recentTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucun ticket récent</div>
                ) : (
                  <div className="space-y-3">
                    {recentTickets.map((ticket: any) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            ticket.status === 'waiting' ? 'bg-yellow-500' :
                            ticket.status === 'called' ? 'bg-blue-500' :
                            ticket.status === 'closed' ? 'bg-green-500' : 'bg-red-500'
                          )} />
                          <div>
                            <p className="font-medium">Ticket #{ticket.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {ticket.service?.name || ticket.service_name || 'Service inconnu'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            ticket.status === 'waiting' ? 'secondary' :
                            ticket.status === 'called' ? 'default' :
                            ticket.status === 'closed' ? 'outline' : 'destructive'
                          }>
                            {ticket.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ticket.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiques rapides */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance par service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.slice(0, 5).map((service: any) => {
                      const sStats = serviceStats[service.id]?.tickets
                      const total = sStats?.created || 0
                      const closed = sStats?.closed || 0
                      const rate = total > 0 ? Math.round((closed / total) * 100) : 0
                      
                      return (
                        <div key={service.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-muted-foreground">{rate}% traités</span>
                          </div>
                          <Progress value={rate} className="h-2" />
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{sStats?.created || 0} créés</span>
                            <span>{sStats?.closed || 0} clos</span>
                            <span>{service.people_waiting || 0} en attente</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Exports rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/admin/notification-logs')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Logs de notifications
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/admin/reports')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Rapports d'activité
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
