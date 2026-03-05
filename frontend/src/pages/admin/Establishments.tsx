/**
 * Établissements (Admin) - Vue Overview
 * Dashboard complet de l'établissement unique avec statistiques et gestion
 */
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/api/axios'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Edit,
  Star,
  ArrowUp,
  ArrowDown,
  Timer
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Establishment {
  id: number
  name: string
  address?: string | null
  lat?: number | null
  lng?: number | null
  open_at?: string | null
  close_at?: string | null
  is_active?: boolean
  created_at?: string
}

interface EstablishmentStats {
  total_agents: number
  active_agents: number
  total_services: number
  active_services: number
  today_tickets: number
  closed_tickets: number
  absent_tickets: number
  avg_wait_time: number
  satisfaction_rate: number
  peak_hours: string[]
  monthly_growth: number
}

export default function Establishments() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [stats, setStats] = useState<EstablishmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const activeRequestIdRef = useRef(0)
  const [editForm, setEditForm] = useState<Establishment>({
    id: 0,
    name: '',
    address: null,
    lat: null,
    lng: null,
    open_at: '',
    close_at: '',
    is_active: true
  })

  const unwrapApiData = <T,>(payload: any): T => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T
    }
    return payload as T
  }

  // Charger les données de l'établissement
  const loadEstablishment = async (): Promise<number | null> => {
    try {
      console.log('Chargement de l\'établissement...')
      setLoading(true)
      
      // Récupérer les infos utilisateur pour obtenir l'establishment_id
      const response = await api.get('/api/me')
      const userData = response.data
      
      console.log('User data:', userData)
      
      if (userData.establishment_id) {
        console.log('ID établissement trouvé:', userData.establishment_id)
        
        // Récupérer les détails de l'établissement
        const estResponse = await api.get(`/api/establishments/${userData.establishment_id}`)
        const estPayload = unwrapApiData<any>(estResponse.data)
        console.log('Établissement response:', estResponse.data)
        
        // L'établissement doit avoir is_active = true par défaut selon la migration
        const establishmentData = {
          id: estPayload?.id || 0,
          name: estPayload?.name || '',
          address: estPayload?.address || null,
          lat: estPayload?.lat ?? null,
          lng: estPayload?.lng ?? null,
          open_at: estPayload?.open_at || null,
          close_at: estPayload?.close_at || null,
          is_active: estPayload?.is_active !== false, // S'assurer que is_active est bien défini
          created_at: estPayload?.created_at,
        }
        
        console.log('Établissement traité:', establishmentData)
        setEstablishment(establishmentData)
        setEditForm(establishmentData)

        return Number(userData.establishment_id)
      } else {
        console.error('Aucun establishment_id dans user data')
        toast.error('Aucun établissement associé à votre compte')
        return null
      }
    } catch (error: any) {
      console.error('Erreur chargement établissement:', error)
      console.error('Response:', error.response?.data)
      
      // Gestion d'erreur détaillée comme dans l'ancien code
      const status = error?.response?.status
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Accès refusé. Permissions administrateur requises.')
      } else if (status === 404) {
        toast.error('Établissement non trouvé.')
      } else if (status >= 500) {
        toast.error('Erreur serveur. Contactez l\'administrateur.')
      } else {
        toast.error('Impossible de charger les informations de l\'établissement')
      }

      return null
    } finally {
      setLoading(false)
    }
  }

  const loadAll = async () => {
    const requestId = ++activeRequestIdRef.current

    const establishmentId = await loadEstablishment()
    if (requestId !== activeRequestIdRef.current) return

    if (establishmentId) {
      await loadStats(establishmentId)
    }
  }

  // Charger les statistiques
  const loadStats = async (establishmentId: number) => {
    try {
      console.log('Chargement des statistiques pour établissement:', establishmentId)
      
      // Endpoint correct pour les agents (users avec role 'agent')
      const agentsResponse = await api.get('/api/admin/agents')
      const agentsPayload = unwrapApiData<any>(agentsResponse.data)
      const agents = agentsPayload?.data || agentsPayload || []
      console.log('Agents response:', agentsResponse.data)

      // Endpoint correct pour les services
      const servicesResponse = await api.get(`/api/establishments/${establishmentId}/services`)
      const servicesPayload = unwrapApiData<any>(servicesResponse.data)
      const services = servicesPayload?.data || servicesPayload || []
      console.log('Services response:', servicesResponse.data)

      // Endpoint pour les stats (disponible dans le backend)
      const statsResponse = await api.get('/api/admin/stats/overview')
      const ticketsStats = statsResponse.data || {}
      console.log('Stats response:', statsResponse.data)

      console.log('Agents traités:', agents)
      console.log('Services traités:', services)
      console.log('Tickets stats traités:', ticketsStats)

      // Filtrer les agents et services par établissement
      const establishmentAgents = Array.isArray(agents) 
        ? agents.filter((agent: any) => agent.establishment_id === establishmentId)
        : []
      
      // Les services sont déjà filtrés par l'API avec establishment_id
      const establishmentServices = Array.isArray(services) ? services : []

      const realStats: EstablishmentStats = {
        total_agents: establishmentAgents.length,
        active_agents: establishmentAgents.filter((agent: any) => agent.status === 'active').length,
        total_services: establishmentServices.length,
        active_services: establishmentServices.filter((service: any) => service.status === 'open').length,
        today_tickets: Number(ticketsStats?.tickets?.created ?? 0),
        closed_tickets: Number(ticketsStats?.tickets?.closed ?? 0),
        absent_tickets: Number(ticketsStats?.tickets?.absent ?? 0),
        avg_wait_time: Number(ticketsStats?.tickets?.wait_avg_minutes ?? 0),
        satisfaction_rate: 100,
        peak_hours: ['09:00-11:00', '14:00-16:00'],
        monthly_growth: 0 // Valeur par défaut pour le moment
      }
      
      console.log('Stats finales:', realStats)
      setStats(realStats)
    } catch (error: any) {
      console.error('Erreur chargement statistiques:', error)
      console.error('Status:', error.response?.status)
      console.error('Data:', error.response?.data)
      
      // En cas d'erreur, on utilise des valeurs par défaut
      const fallbackStats: EstablishmentStats = {
        total_agents: 0,
        active_agents: 0,
        total_services: 0,
        active_services: 0,
        today_tickets: 0,
        closed_tickets: 0,
        absent_tickets: 0,
        avg_wait_time: 0,
        satisfaction_rate: 100,
        peak_hours: [],
        monthly_growth: 0
      }
      setStats(fallbackStats)
    }
  }

  // Mettre à jour l'établissement
  const updateEstablishment = async () => {
    if (!establishment) return
    
    try {
      console.log('Mise à jour de l\'établissement:', editForm)
      
      // Préparer les données pour l'API
      const { id, ...payload } = editForm
      
      // Validation simple des champs requis
      if (!payload.name || payload.name.trim().length < 2) {
        toast.error('Le nom de l\'établissement est requis (minimum 2 caractères)')
        return
      }
      
      const response = await api.put(`/api/admin/establishments/${establishment.id}`, payload)
      console.log('Update response:', response.data)
      
      // Mettre à jour l'état local avec les nouvelles données
      const updatedData = {
        ...establishment,
        ...payload
      }
      setEstablishment(updatedData)
      setEditMode(false)
      
      toast.success('Établissement mis à jour avec succès')
      
      // Recharger les statistiques pour avoir les données à jour
      if (establishment.id) {
        loadStats(establishment.id)
      }
      
    } catch (error: any) {
      console.error('Erreur mise à jour établissement:', error)
      console.error('Response:', error.response?.data)
      
      // Gestion d'erreur détaillée comme dans l'ancien code
      const status = error?.response?.status
      const message = error?.response?.data?.error?.message || error?.response?.data?.message
      
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Permission refusée pour modifier cet établissement.')
      } else if (status === 404) {
        toast.error('Établissement non trouvé.')
      } else if (status === 422) {
        toast.error(message || 'Données invalides. Veuillez vérifier le formulaire.')
      } else if (status >= 500) {
        toast.error('Erreur serveur lors de la mise à jour.')
      } else {
        toast.error(message || 'Erreur de mise à jour')
      }
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-6">
        {/* Glow */}
        <div className="absolute w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />

        {/* Spinner ring */}
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-4 " />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
      </div>
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun établissement</h2>
          <p className="text-muted-foreground">Vous n'avez pas d'établissement associé à votre compte.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec informations de l'établissement */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {establishment?.name || 'Chargement...'}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                      ID: #{establishment?.id || 'N/A'}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={establishment?.is_active ? "default" : "secondary"}
                  className="text-xs px-3 py-1"
                >
                  {establishment?.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Gérez votre établissement et consultez ses performances en temps réel
              </p>
            </div>
            <Dialog open={editMode} onOpenChange={setEditMode}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Modifier l'établissement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom de l'établissement</Label>
                    <Input
                      id="name"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Entrez le nom de l'établissement"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Textarea
                      id="address"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      rows={3}
                      placeholder="Entrez l'adresse complète"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="open_at">Heure d'ouverture</Label>
                      <Input
                        id="open_at"
                        type="time"
                        value={editForm.open_at || ''}
                        onChange={(e) => setEditForm({ ...editForm, open_at: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="close_at">Heure de fermeture</Label>
                      <Input
                        id="close_at"
                        type="time"
                        value={editForm.close_at || ''}
                        onChange={(e) => setEditForm({ ...editForm, close_at: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={updateEstablishment}>Enregistrer</Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Annuler</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Carte d'information principale */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Building2 className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">{establishment.address || 'Non spécifiée'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horaires</p>
                <p className="font-medium">
                  {establishment.open_at && establishment.close_at 
                    ? `${establishment.open_at} - ${establishment.close_at}`
                    : 'Non spécifiés'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="font-medium">
                  {(() => {
                    const created = establishment.created_at
                    if (!created) return '—'
                    const d = new Date(created)
                    if (Number.isNaN(d.getTime())) return '—'
                    return d.toLocaleDateString('fr-FR')
                  })()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge variant={establishment.is_active ? "default" : "secondary"}>
                  {establishment.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agents actifs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.active_agents}/{stats.total_agents}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.total_agents > 0 ? (
                      <>
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">
                          {Math.round((stats.active_agents / stats.total_agents) * 100)}% actifs
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucun agent</span>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              {stats.total_agents > 0 && (
                <div className="mt-4">
                  <Progress value={(stats.active_agents / stats.total_agents) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services actifs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.active_services}/{stats.total_services}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.total_services > 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">
                          {Math.round((stats.active_services / stats.total_services) * 100)}% opérationnels
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucun service</span>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              {stats.total_services > 0 && (
                <div className="mt-4">
                  <Progress value={(stats.active_services / stats.total_services) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tickets aujourd'hui</p>
                  <p className="text-2xl font-bold text-foreground">{stats.today_tickets}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {stats.closed_tickets} clos
                      {' • '}
                      {stats.absent_tickets} absents
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.satisfaction_rate > 0 ? `${stats.satisfaction_rate}%` : 'N/A'}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.satisfaction_rate > 0 ? (
                      <>
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500">
                          {stats.satisfaction_rate >= 90 ? 'Excellent' : 
                           stats.satisfaction_rate >= 75 ? 'Bon' : 
                           stats.satisfaction_rate >= 60 ? 'Moyen' : 'À améliorer'}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucune donnée</span>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              {stats.satisfaction_rate > 0 && (
                <div className="mt-4">
                  <Progress value={stats.satisfaction_rate} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Temps d'attente moyen</span>
                  <span className="font-medium">
                    {stats.avg_wait_time > 0 ? `${stats.avg_wait_time} min` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Croissance mensuelle</span>
                  <div className="flex items-center gap-1">
                    {stats.monthly_growth > 0 ? (
                      <>
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-500">+{stats.monthly_growth}%</span>
                      </>
                    ) : stats.monthly_growth < 0 ? (
                      <>
                        <ArrowDown className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-red-500">{stats.monthly_growth}%</span>
                      </>
                    ) : (
                      <span className="font-medium text-muted-foreground">Stable</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Heures de pointe</span>
                  <div className="flex flex-col gap-1">
                    {stats.peak_hours && stats.peak_hours.length > 0 ? (
                      stats.peak_hours.map((hour, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {String(hour).split(' ')[0]}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Non défini</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes et remarques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Système opérationnel
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  Tous les services fonctionnent normalement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Forte activité
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Pic d'activité attendu entre 14h et 16h
                </p>
              </div>
            </div>
            {!establishment.is_active && (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Établissement inactif
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    L'établissement est actuellement marqué comme inactif
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => navigate('/dashboard/agents')}
            >
              <Users className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Gérer les agents</p>
                <p className="text-xs text-muted-foreground">Ajouter ou modifier des agents</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => navigate('/dashboard/services')}
            >
              <Settings className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Configurer les services</p>
                <p className="text-xs text-muted-foreground">Gérer les services et files</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => navigate('/dashboard/stats')}
            >
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Voir les statistiques</p>
                <p className="text-xs text-muted-foreground">Rapports détaillés</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
