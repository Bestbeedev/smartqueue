import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Users, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Server,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface MonitoringData {
  establishments: number
  services: {
    total: number
    open: number
    closed: number
  }
  counters: {
    total: number
    open: number
    closed: number
  }
  tickets: {
    total: number
    waiting: number
    called: number
    absent: number
    processed: number
  }
  performance: {
    avg_wait_time: number
    avg_service_time: number
    satisfaction_rate: number
  }
  system: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    uptime: number
  }
  subscriptions_by_status: {
    active: number
    trial: number
    expired: number
    canceled: number
  }
  timeline: Array<{
    date: string
    establishments: number
    tickets: number
    revenue: number
  }>
}

export default function SaasMonitoring() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setRefreshing(true)
    try {
      const r = await api.get('/api/saas/monitoring/overview')
      setData(r.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { 
    setLoading(true)
    load() 
  }, [])

  if (loading && !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Chargement du monitoring...</p>
      </div>
    </div>
  )

  const subscriptionData = data?.subscriptions_by_status ? [
    { name: 'Actifs', value: data.subscriptions_by_status.active, color: '#10b981' },
    { name: 'Essai', value: data.subscriptions_by_status.trial, color: '#3b82f6' },
    { name: 'Expirés', value: data.subscriptions_by_status.expired, color: '#f59e0b' },
    { name: 'Annulés', value: data.subscriptions_by_status.canceled, color: '#ef4444' }
  ] : []

  const performanceData = data?.performance ? [
    { name: 'Temps attente', value: data.performance.avg_wait_time, max: 30, unit: 'min' },
    { name: 'Temps service', value: data.performance.avg_service_time, max: 20, unit: 'min' },
    { name: 'Satisfaction', value: data.performance.satisfaction_rate, max: 100, unit: '%' }
  ] : []

  const systemData = data?.system ? [
    { name: 'CPU', value: data.system.cpu_usage, max: 100, unit: '%' },
    { name: 'Mémoire', value: data.system.memory_usage, max: 100, unit: '%' },
    { name: 'Disque', value: data.system.disk_usage, max: 100, unit: '%' }
  ] : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Monitoring SaaS</h1>
            <p className="text-muted-foreground">Vue globale de la plateforme et métriques en temps réel</p>
          </div>
          <Button 
            variant="outline" 
            onClick={load} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Établissements</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.establishments ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% ce mois
              </p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services actifs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.services?.open ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                sur {data?.services?.total ?? 0} total
              </p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets aujourd'hui</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.tickets?.total ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +8% vs hier
              </p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux satisfaction</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.performance?.satisfaction_rate ?? 0}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2% ce mois
              </p>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tickets Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Statuts des tickets</CardTitle>
                  <CardDescription>Répartition des tickets par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.tickets && [
                      { label: 'En attente', value: data.tickets.waiting, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
                      { label: 'Appelés', value: data.tickets.called, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
                      { label: 'Absents', value: data.tickets.absent, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
                      { label: 'Traités', value: data.tickets.processed, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.bg}`} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                          <div className="text-xs text-muted-foreground">
                            {data.tickets.total ? Math.round((item.value / data.tickets.total) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Chart */}
              {data?.timeline && (
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution sur 30 jours</CardTitle>
                    <CardDescription>Croissance des établissements et tickets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.timeline}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="establishments" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                          name="Établissements"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="tickets" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          dot={false}
                          name="Tickets"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des abonnements</CardTitle>
                  <CardDescription>Par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Détail des abonnements</CardTitle>
                  <CardDescription>Informations par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subscriptionData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{item.value}</span>
                          <Badge variant={item.name === 'Actifs' ? 'default' : 'secondary'}>
                            {item.name === 'Actifs' ? 'En cours' : item.name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs de performance</CardTitle>
                  <CardDescription>Moyennes sur les 7 derniers jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.value}{item.unit} / {item.max}{item.unit}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance temporelle</CardTitle>
                  <CardDescription>Évolution des métriques clés</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data?.timeline || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tickets" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        name="Tickets"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Ressources système</CardTitle>
                  <CardDescription>Utilisation des ressources serveur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className={`text-sm font-medium ${
                            item.value > 80 ? 'text-red-600' : 
                            item.value > 60 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.value}{item.unit}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.value > 80 ? 'bg-red-500' : 
                              item.value > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>État du système</CardTitle>
                  <CardDescription>Informations générales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Uptime</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{data?.system?.uptime ?? 0}%</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Base de données</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Connectée</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">API</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Opérationnelle</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Alertes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">0</span>
                        <Badge variant="secondary">Aucune</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
