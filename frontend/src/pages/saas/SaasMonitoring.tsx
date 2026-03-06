import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState, ErrorState } from '@/components/ui/loading-state'
import { useApiData } from '@/hooks/use-api-data'
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
  RefreshCw,
  DollarSign,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { StatusChart } from '@/components/ui/status-chart'
import { 
  VerticalBarChart, 
  DonutChart, 
  LineChartComponent, 
  AreaChartComponent 
} from '@/components/ui/charts'

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
  const { data, loading, refreshing, error, refresh } = useApiData<MonitoringData>(
    '/api/saas/monitoring/overview',
    {
      showToast: true,
      onSuccess: (data) => {
        console.log('Monitoring data loaded successfully:', data)
      }
    }
  )

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingState message="Chargement du monitoring..." size="lg" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ErrorState 
            message={error} 
            onRetry={refresh}
          />
        </div>
      </div>
    )
  }

  const subscriptionData = data?.subscriptions_by_status ? [
    { 
      name: 'Actifs', 
      value: data.subscriptions_by_status.active, 
      color: '#10b981', 
      icon: <CheckCircle className="w-4 h-4" />,
      trend: { value: 15, isPositive: true }
    },
    { 
      name: 'Essai', 
      value: data.subscriptions_by_status.trial, 
      color: '#3b82f6', 
      icon: <Clock className="w-4 h-4" />,
      trend: { value: -8, isPositive: false }
    },
    { 
      name: 'Expirés', 
      value: data.subscriptions_by_status.expired, 
      color: '#f59e0b', 
      icon: <AlertCircle className="w-4 h-4" />,
      trend: { value: 3, isPositive: true }
    },
    { 
      name: 'Annulés', 
      value: data.subscriptions_by_status.canceled, 
      color: '#ef4444', 
      icon: <XCircle className="w-4 h-4" />,
      trend: { value: -2, isPositive: false }
    }
  ] : []

  const ticketsData = data?.tickets ? [
    { name: 'En attente', value: data.tickets.waiting, color: '#3b82f6' },
    { name: 'Appelés', value: data.tickets.called, color: '#10b981' },
    { name: 'Absents', value: data.tickets.absent, color: '#f59e0b' },
    { name: 'Traités', value: data.tickets.processed, color: '#8b5cf6' }
  ] : []

  const performanceData = data?.performance ? [
    { name: 'Temps attente', value: data.performance.avg_wait_time, max: 30, unit: 'min' },
    { name: 'Temps service', value: data.performance.avg_service_time, max: 20, unit: 'min' },
    { name: 'Satisfaction', value: data.performance.satisfaction_rate, max: 100, unit: '%' }
  ] : []

  const systemData = data?.system ? [
    { name: 'CPU', value: data.system.cpu_usage, color: '#3b82f6' },
    { name: 'Mémoire', value: data.system.memory_usage, color: '#10b981' },
    { name: 'Disque', value: data.system.disk_usage, color: '#f59e0b' }
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
            onClick={refresh} 
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
              {/* Tickets Status - Vertical Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Statuts des tickets</CardTitle>
                  <CardDescription>Répartition des tickets par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <VerticalBarChart 
                    data={ticketsData}
                    height={280}
                    showLabels={true}
                  />
                </CardContent>
              </Card>

              {/* Growth Timeline - Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution sur 30 jours</CardTitle>
                  <CardDescription>Croissance des établissements et tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChartComponent 
                    data={data?.timeline || []}
                    lines={[
                      {
                        dataKey: 'establishments',
                        stroke: 'hsl(var(--primary))',
                        name: 'Établissements'
                      },
                      {
                        dataKey: 'tickets',
                        stroke: 'hsl(var(--chart-2))',
                        name: 'Tickets'
                      }
                    ]}
                    height={280}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Donut Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des abonnements</CardTitle>
                  <CardDescription>Distribution par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart 
                    data={subscriptionData}
                    height={300}
                    innerRadius={70}
                    outerRadius={100}
                  />
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

              {/* Performance Area Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance temporelle</CardTitle>
                  <CardDescription>Évolution des tickets traités</CardDescription>
                </CardHeader>
                <CardContent>
                  <AreaChartComponent 
                    data={data?.timeline || []}
                    areas={[
                      {
                        dataKey: 'tickets',
                        stroke: 'hsl(var(--primary))',
                        fill: 'hsl(var(--primary))',
                        name: 'Tickets',
                        fillOpacity: 0.2
                      }
                    ]}
                    height={280}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Resources - Vertical Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Ressources système</CardTitle>
                  <CardDescription>Utilisation des ressources serveur</CardDescription>
                </CardHeader>
                <CardContent>
                  <VerticalBarChart 
                    data={systemData}
                    height={280}
                    showLabels={true}
                  />
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
