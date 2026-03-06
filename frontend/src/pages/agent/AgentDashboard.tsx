import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { useAppSelector } from '@/store'
import { toast } from 'sonner'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AgentDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [todayTickets, setTodayTickets] = useState<any[]>([])
  const user = useAppSelector((s) => s.auth.user)

  const loadStats = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const response = await api.get('/api/agent/dashboard/stats')
      setStats(response.data)
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Accès refusé. Permissions agent requises.')
      } else {
        toast.error('Impossible de charger les statistiques')
      }
      console.error('Erreur lors du chargement des statistiques agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTodayTickets = async () => {
    try {
      const response = await api.get('/api/agent/tickets/today')
      setTodayTickets(response.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des tickets du jour:', error)
    }
  }

  useEffect(() => {
    loadStats()
    loadTodayTickets()
  }, [])

  const todayStats = {
    total: todayTickets.length,
    called: todayTickets.filter(t => t.status === 'called').length,
    completed: todayTickets.filter(t => t.status === 'completed').length,
    pending: todayTickets.filter(t => t.status === 'pending').length
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Espace Agent
        </h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenue {user?.name}, voici votre activité du jour
        </p>
      </div>

      {/* Statistiques du jour */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets à traiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              En attente d'appel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets appelés</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.called}</div>
            <p className="text-xs text-muted-foreground">
              Appelés aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets complétés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Traités avec succès
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total du jour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Tous les tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets récents */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayTickets.slice(0, 10).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    ticket.status === 'pending' && "bg-yellow-500",
                    ticket.status === 'called' && "bg-blue-500",
                    ticket.status === 'completed' && "bg-green-500"
                  )} />
                  <div>
                    <p className="font-medium">Ticket #{ticket.number}</p>
                    <p className="text-sm text-muted-foreground">{ticket.service_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={ticket.status === 'completed' ? 'default' : 'secondary'}>
                    {ticket.status === 'pending' ? 'En attente' : 
                     ticket.status === 'called' ? 'Appelé' : 'Complété'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ticket.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {todayTickets.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucun ticket aujourd'hui
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="default">
              <Activity className="mr-2 h-4 w-4" />
              Appeler prochain ticket
            </Button>
            <Button className="w-full" variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Marquer comme complété
            </Button>
            <Button className="w-full" variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Signaler un problème
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Temps moyen</span>
                <span className="text-sm font-bold">
                  {stats?.avg_time ? `${stats.avg_time} min` : '12 min'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tickets/jour</span>
                <span className="text-sm font-bold">
                  {stats?.tickets_per_day || '15'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Satisfaction</span>
                <span className="text-sm font-bold">
                  {stats?.satisfaction ? `${stats.satisfaction}%` : '95%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
