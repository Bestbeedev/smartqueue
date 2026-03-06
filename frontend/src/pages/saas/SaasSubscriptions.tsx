import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState, ErrorState } from '@/components/ui/loading-state'
import { usePaginatedApiData } from '@/hooks/use-api-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Search,
  DollarSign,
  Users,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
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
import { StatusChart } from '@/components/ui/status-chart'

type Subscription = {
  id: number
  establishment_id: number
  plan: string
  status: string
  current_period_start?: string | null
  current_period_end?: string | null
  establishment?: { id: number; name: string }
  created_at?: string
  monthly_revenue?: number
  total_tickets?: number
  avg_monthly_tickets?: number
}

export default function SaasSubscriptions() {
  const [status, setStatus] = useState('all')
  const [plan, setPlan] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'monthly_revenue' | 'establishment_name' | 'current_period_end'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data: rows, loading, refreshing, error, refresh } = usePaginatedApiData<Subscription>(
    '/api/saas/subscriptions',
    {
      perPage: 100,
      showToast: true,
      onSuccess: (data) => {
        console.log('Subscriptions loaded successfully:', data)
      }
    }
  )

  // Load filtered data when filters change
  useEffect(() => {
    const params: Record<string, any> = {}
    if (status !== 'all') params.status = status
    if (plan !== 'all') params.plan = plan
    
    refresh(params)
  }, [status, plan, refresh])

  if (loading && !rows.length) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingState message="Chargement des abonnements..." size="lg" />
        </div>
      </div>
    )
  }

  if (error && !rows.length) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ErrorState 
            message={error} 
            onRetry={() => refresh()}
          />
        </div>
      </div>
    )
  }

  // Filtrage et tri
  const filteredAndSortedRows = rows
    .filter(subscription => {
      const matchesSearch = subscription.establishment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.plan.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = status === 'all' || subscription.status === status
      const matchesPlan = plan === 'all' || subscription.plan === plan
      
      return matchesSearch && matchesStatus && matchesPlan
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]
      
      if (sortBy === 'created_at' || sortBy === 'current_period_end') {
        aValue = new Date(aValue || 0)
        bValue = new Date(bValue || 0)
      } else if (sortBy === 'establishment_name') {
        aValue = a.establishment?.name || ''
        bValue = b.establishment?.name || ''
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Statistiques
  const stats = {
    total: rows.length,
    active: rows.filter(r => r.status === 'active').length,
    trial: rows.filter(r => r.status === 'trial').length,
    expired: rows.filter(r => r.status === 'expired').length,
    canceled: rows.filter(r => r.status === 'canceled').length,
    basic: rows.filter(r => r.plan === 'basic').length,
    pro: rows.filter(r => r.plan === 'pro').length,
    enterprise: rows.filter(r => r.plan === 'enterprise').length,
    monthlyRevenue: rows.reduce((sum, r) => sum + (r.monthly_revenue || 0), 0),
    totalTickets: rows.reduce((sum, r) => sum + (r.total_tickets || 0), 0)
  }

  const statusData = [
    { 
      name: 'Actifs', 
      value: stats.active, 
      color: '#10b981', 
      icon: <CheckCircle className="w-4 h-4" />,
      trend: { value: 12, isPositive: true }
    },
    { 
      name: 'Essai', 
      value: stats.trial, 
      color: '#3b82f6', 
      icon: <Clock className="w-4 h-4" />,
      trend: { value: -5, isPositive: false }
    },
    { 
      name: 'Expirés', 
      value: stats.expired, 
      color: '#f59e0b', 
      icon: <AlertCircle className="w-4 h-4" />,
      trend: { value: 8, isPositive: true }
    },
    { 
      name: 'Annulés', 
      value: stats.canceled, 
      color: '#ef4444', 
      icon: <XCircle className="w-4 h-4" />,
      trend: { value: -3, isPositive: false }
    }
  ]

  const planData = [
    { name: 'Basic', value: stats.basic, revenue: 19 },
    { name: 'Pro', value: stats.pro, revenue: 49 },
    { name: 'Enterprise', value: stats.enterprise, revenue: 149 }
  ]

  const monthlyRevenueData = rows
    .filter(r => r.status === 'active')
    .reduce((acc, sub) => {
      const month = new Date(sub.created_at || '').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      const existing = acc.find(item => item.month === month)
      if (existing) {
        existing.revenue += sub.monthly_revenue || 0
        existing.count += 1
      } else {
        acc.push({ month, revenue: sub.monthly_revenue || 0, count: 1 })
      }
      return acc
    }, [] as Array<{ month: string; revenue: number; count: number }>)

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      canceled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPlanBadge = (plan: string) => {
    const colors = {
      basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      pro: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    }
    return colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Abonnements</h1>
            <p className="text-muted-foreground">Gestion des abonnements et revenus SaaS</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refresh()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu mensuel</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Essais en cours</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.trial}</div>
              <p className="text-xs text-muted-foreground">
                Conversion: {stats.trial ? Math.round((stats.active / stats.trial) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.total ? Math.round((stats.canceled / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.canceled} annulations ce mois
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenus mensuels</CardTitle>
              <CardDescription>Évolution des revenus sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      `${value}€`,
                      name === 'revenue' ? 'Revenu' : 'Abonnements'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <StatusChart
            title="Répartition par statut"
            description="Abonnements par statut"
            data={statusData}
            height={250}
            showTrend={true}
          />
        </div>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution par plan</CardTitle>
            <CardDescription>Revenus potentiels par type d'abonnement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planData.map((plan) => (
                <div key={plan.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <Badge className={getPlanBadge(plan.name)}>
                      {plan.value} clients
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Prix/mois</span>
                      <span className="font-bold">{plan.revenue}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenu total</span>
                      <span className="font-bold">{(plan.value * plan.revenue).toLocaleString()}€</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres et recherche</CardTitle>
            <CardDescription>Recherchez et filtrez les abonnements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par établissement ou plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="trial">Essai</SelectItem>
                  <SelectItem value="expired">Expirés</SelectItem>
                  <SelectItem value="canceled">Annulés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date de création</SelectItem>
                  <SelectItem value="monthly_revenue">Revenu mensuel</SelectItem>
                  <SelectItem value="establishment_name">Nom établissement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liste des abonnements</CardTitle>
                <CardDescription>
                  {filteredAndSortedRows.length} résultat{filteredAndSortedRows.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Établissement</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Revenu/mois</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRows.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.establishment?.name || `ID: ${subscription.establishment_id}`}</div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.created_at ? 
                              `Depuis ${new Date(subscription.created_at).toLocaleDateString('fr-FR')}` : 
                              'Date inconnue'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanBadge(subscription.plan)}>
                          {subscription.plan.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {subscription.current_period_start && subscription.current_period_end ? (
                            <div>
                              <div>du {new Date(subscription.current_period_start).toLocaleDateString('fr-FR')}</div>
                              <div>au {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Non définie</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {subscription.monthly_revenue ? `${subscription.monthly_revenue}€` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {subscription.total_tickets || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <CreditCard className="h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">Aucun abonnement trouvé</p>
                          <p className="text-sm">
                            {searchTerm || status !== 'all' || plan !== 'all' ? 
                              'Essayez de modifier vos filtres' : 
                              'Aucun abonnement dans la base de données'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
