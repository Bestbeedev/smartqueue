import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { useAppSelector } from '@/store'
import { toast } from 'sonner'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const role = useAppSelector((s) => s.auth.user?.role)
  const user = useAppSelector((s) => s.auth.user)

  const loadStats = async () => {
    if (loading) return
    if (role !== 'admin') return
    
    setLoading(true)
    try {
      const response = await api.get(`/api/admin/stats/overview?range=${timeRange}`)
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

  const loadRecentActivity = async () => {
    try {
      const response = await api.get('/api/admin/recent-activity')
      // Utiliser les vraies données ou garder les données mock si API pas dispo
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité récente:', error)
    }
  }

  useEffect(() => {
    loadStats()
    loadRecentActivity()
  }, [role, timeRange])

  // Utiliser les vraies données ou les données par défaut
  const lineData = stats?.daily_stats || [
    { name: 'Lun', tickets: 12, resolved: 8 },
    { name: 'Mar', tickets: 19, resolved: 15 },
    { name: 'Mer', tickets: 15, resolved: 12 },
    { name: 'Jeu', tickets: 27, resolved: 22 },
    { name: 'Ven', tickets: 23, resolved: 18 },
    { name: 'Sam', tickets: 18, resolved: 16 },
    { name: 'Dim', tickets: 8, resolved: 7 },
  ]

  const pieData = stats?.service_distribution || [
    { name: 'Accueil', value: 35, color: '#3b82f6' },
    { name: 'Comptabilité', value: 25, color: '#10b981' },
    { name: 'RH', value: 20, color: '#f59e0b' },
    { name: 'Direction', value: 20, color: '#8b5cf6' },
  ]

  const recentActivities = [
    {
      id: 1,
      title: 'Nouveau ticket créé',
      description: 'Ticket #1001 - Service Accueil',
      time: 'Il y a 2 min',
      type: 'info',
      icon: Ticket
    },
    {
      id: 2,
      title: 'Ticket résolu',
      description: 'Ticket #998 - Service Comptabilité',
      time: 'Il y a 5 min',
      type: 'success',
      icon: CheckCircle
    },
    {
      id: 3,
      title: 'Ticket prioritaire',
      description: 'Ticket #1002 nécessite une attention immédiate',
      time: 'Il y a 8 min',
      type: 'warning',
      icon: AlertTriangle
    },
    {
      id: 4,
      title: 'Client absent',
      description: 'Ticket #995 - Service RH',
      time: 'Il y a 12 min',
      type: 'error',
      icon: UserX
    },
    {
      id: 5,
      title: 'File terminée',
      description: 'File A - 15 tickets traités',
      time: 'Il y a 15 min',
      type: 'success',
      icon: CheckCircle
    }
  ]

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

      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Tickets créés"
          value={stats?.tickets?.created ?? '156'}
          change={{ value: 12, type: 'increase' }}
          icon={Ticket}
          description="Nouveaux tickets cette période"
        />
        <AnalyticsCard
          title="Tickets résolus"
          value={stats?.tickets?.closed ?? '142'}
          change={{ value: 8, type: 'increase' }}
          icon={CheckCircle}
          description="Tickets traités avec succès"
        />
        <AnalyticsCard
          title="Temps d'attente moyen"
          value={stats?.tickets?.wait_avg_minutes ? `${stats.tickets.wait_avg_minutes} min` : '12 min'}
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

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartContainer
          title="Activité des tickets"
          description="Évolution des tickets créés et résolus"
          actions={
            <Button variant="outline" size="sm" className="hover:bg-accent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="tickets" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#3b82f6' }}
                activeDot={{ r: 7, stroke: '#2563eb', strokeWidth: 2 }}
                name="Tickets créés"
              />
              <Line 
                type="monotone" 
                dataKey="resolved" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981' }}
                activeDot={{ r: 7, stroke: '#059669', strokeWidth: 2 }}
                name="Tickets résolus"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Répartition par service"
          description="Distribution des tickets par service"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
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

      {/* Activités récentes et métriques */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activités récentes */}
        <Card className="bg-card border-border transition-all duration-300 ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground transition-colors duration-300">
              <Bell className="h-5 w-5" />
              Activités récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl transition-all hover-card duration-300 hover-sidebar">
                  <div className={cn(
                    "p-2 rounded-xl border transition-all duration-300",
                    activity.type === 'success' && "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
                    activity.type === 'warning' && "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
                    activity.type === 'error' && "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                    activity.type === 'info' && "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate transition-colors duration-300">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate transition-colors duration-300">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 transition-colors duration-300">
                      {activity.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Métriques clés */}
        <Card className="bg-card border-border transition-all duration-300 ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground transition-colors duration-300">
              <TrendingUp className="h-5 w-5" />
              Métriques clés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full shadow-sm" />
                  <span className="text-sm font-medium text-muted-foreground transition-colors duration-300">Taux de résolution</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-foreground transition-colors duration-300">87%</span>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2 transition-all duration-300 shadow-inner shadow-gray-900/10 dark:shadow-black/20">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: '87%' }} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full shadow-sm" />
                  <span className="text-sm font-medium text-muted-foreground transition-colors duration-300">Satisfaction client</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-foreground transition-colors duration-300">4.5/5</span>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2 transition-all duration-300 shadow-inner shadow-gray-900/10 dark:shadow-black/20">
                <div className="bg-yellow-500 h-2 rounded-full transition-all duration-500" style={{ width: '90%' }} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full shadow-sm" />
                  <span className="text-sm font-medium text-muted-foreground transition-colors duration-300">Temps de réponse</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-foreground transition-colors duration-300">12 min</span>
                  <ArrowDownRight className="h-4 w-4 text-green-500" />
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2 transition-all duration-300 shadow-inner shadow-gray-900/10 dark:shadow-black/20">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: '60%' }} />
              </div>
            </div>

            <div className={cn(
              "pt-4 border-t transition-colors duration-300",
              "border-border"
            )}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">1,234</p>
                  <p className="text-xs text-muted-foreground transition-colors duration-300">Total tickets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors duration-300">98.5%</p>
                  <p className="text-xs text-muted-foreground transition-colors duration-300">Disponibilité</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
