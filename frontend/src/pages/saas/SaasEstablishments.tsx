import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Building2, 
  Users, 
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  Download,
  Mail
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

type Establishment = {
  id: number
  name: string
  address?: string | null
  city?: string
  country?: string
  is_active?: boolean
  subscription?: { id: number; plan: string; status: string } | null
  created_at?: string
  last_active?: string
  total_tickets?: number
  total_agents?: number
  avg_wait_time?: number
}

export default function SaasEstablishments() {
  const [rows, setRows] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'pro' | 'enterprise'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'total_tickets'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const load = async () => {
    if (loading) return
    setLoading(true)
    try {
      const response = await api.get('/api/saas/establishments?per_page=100')
      const list = response.data?.data || response.data
      setRows(Array.isArray(list) ? list : [])
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Accès refusé. Permissions requises.')
      } else if (status === 404) {
        toast.error('Endpoint non trouvé. Vérifiez l\'API.')
      } else if (status >= 500) {
        toast.error('Erreur serveur. Contactez l\'administrateur.')
      } else {
        toast.error('Impossible de charger les établissements')
      }
      console.error('Erreur lors du chargement des établissements:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Filtrage et tri
  const filteredAndSortedRows = rows
    .filter(establishment => {
      const matchesSearch = establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         establishment.address?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && establishment.is_active) ||
                           (statusFilter === 'inactive' && !establishment.is_active)
      const matchesPlan = planFilter === 'all' || establishment.subscription?.plan === planFilter
      
      return matchesSearch && matchesStatus && matchesPlan
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]
      
      if (sortBy === 'created_at' || sortBy === 'last_active') {
        aValue = new Date(aValue || 0)
        bValue = new Date(bValue || 0)
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
    active: rows.filter(r => r.is_active).length,
    inactive: rows.filter(r => !r.is_active).length,
    basic: rows.filter(r => r.subscription?.plan === 'basic').length,
    pro: rows.filter(r => r.subscription?.plan === 'pro').length,
    enterprise: rows.filter(r => r.subscription?.plan === 'enterprise').length,
    totalTickets: rows.reduce((sum, r) => sum + (r.total_tickets || 0), 0),
    totalAgents: rows.reduce((sum, r) => sum + (r.total_agents || 0), 0)
  }

  const planData = [
    { name: 'Basic', value: stats.basic, color: '#3b82f6' },
    { name: 'Pro', value: stats.pro, color: '#10b981' },
    { name: 'Enterprise', value: stats.enterprise, color: '#8b5cf6' }
  ]

  const statusData = [
    { name: 'Actifs', value: stats.active, color: '#10b981' },
    { name: 'Inactifs', value: stats.inactive, color: '#ef4444' }
  ]

  const getPlanBadge = (plan: string) => {
    const colors = {
      basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      pro: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    }
    return colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Clients (Établissements)</h1>
            <p className="text-muted-foreground">Gestion multi-établissements et monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total clients</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +15% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Tickets totaux</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +8% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents totaux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                Moyenne: {stats.total ? Math.round(stats.totalAgents / stats.total) : 0} par établissement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par abonnement</CardTitle>
              <CardDescription>Nombre de clients par type de plan</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={planData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statuts des clients</CardTitle>
              <CardDescription>Actifs vs Inactifs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres et recherche</CardTitle>
            <CardDescription>Recherchez et filtrez les établissements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou adresse..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs uniquement</SelectItem>
                  <SelectItem value="inactive">Inactifs uniquement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={(value: any) => setPlanFilter(value)}>
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
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="total_tickets">Tickets</SelectItem>
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
                <CardTitle>Liste des établissements</CardTitle>
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
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRows.map((establishment) => (
                    <TableRow key={establishment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{establishment.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {establishment.address || 'Adresse non renseignée'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(establishment.is_active ?? true)}>
                          {establishment.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {establishment.subscription ? (
                          <Badge className={getPlanBadge(establishment.subscription.plan)}>
                            {establishment.subscription.plan.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Aucun</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {establishment.total_tickets || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {establishment.total_agents || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {establishment.last_active ? 
                            new Date(establishment.last_active).toLocaleDateString('fr-FR') : 
                            'Jamais'
                          }
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
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Building2 className="h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">Aucun établissement trouvé</p>
                          <p className="text-sm">
                            {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
                              ? 'Essayez de modifier vos filtres' 
                              : 'Commencez par ajouter votre premier client'
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
