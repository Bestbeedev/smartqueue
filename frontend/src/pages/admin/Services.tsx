/**
 * Services (Admin)
 * Gestion des services avec modals de création/édition.
 * - GET /api/admin/services (liste)
 * - POST /api/admin/services (création)
 * - PUT /api/admin/services/{id} (édition)
 * Champs: establishment_id, name, avg_service_time_minutes, status (open/closed), priority_support
 */
import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Ticket, Edit, Trash2, Pencil, QrCode, Download } from 'lucide-react'

type Service = { 
  id:number; 
  name:string; 
  status:string; 
  avg_service_time_minutes?:number; 
  priority_support?:boolean; 
  capacity?: number | null; 
  establishment?: { id:number; name:string };
  qr_code_token?: string;
  qr_code_url?: string;
  qr_generated_at?: string;
}
type Establishment = { id:number; name:string }

export default function Services(){
  const [rows, setRows] = useState<Service[]>([])
  const [ests, setEsts] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(false)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openQr, setOpenQr] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [qrService, setQrService] = useState<Service | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  // Formulaires
  const [createForm, setCreateForm] = useState({ establishment_id: 0, name:'', avg_service_time_minutes: 5, status:'open', priority_support:false, capacity: null as number | null })
  const [editForm, setEditForm] = useState({ establishment_id: 0, name:'', avg_service_time_minutes: 5, status:'open', priority_support:false, capacity: null as number | null })
  const [createErrors, setCreateErrors] = useState<Record<string,string>>({})
  const [editErrors, setEditErrors] = useState<Record<string,string>>({})

  // Schémas de validation Zod
  const serviceSchema = z.object({
    establishment_id: z.number().int().positive('Établissement requis'),
    name: z.string().min(2, 'Nom trop court'),
    avg_service_time_minutes: z.number().int().min(1).max(240),
    status: z.enum(['open','closed']),
    priority_support: z.boolean(),
    capacity: z.union([z.number().int().min(1).max(100000), z.null()]),
  })

  const load = async () => {
    if (loading) return // Éviter les appels multiples
    setLoading(true)
    try {
      const response = await api.get('/api/admin/services?per_page=50')
      const data = response.data.data || response.data
      const arr = Array.isArray(data) ? data : []
      setRows(arr)
      // Pas de toast ici pour éviter les messages au chargement initial
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
        toast.error('Impossible de charger les services')
      }
      console.error('Erreur lors du chargement des services:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const loadEsts = async () => {
    try {
      const response = await api.get('/api/admin/establishments?per_page=50')
      const data = response.data.data || response.data
      setEsts(Array.isArray(data) ? data : [])
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Accès refusé. Permissions administrateur requises.')
      } else {
        toast.error('Impossible de charger les établissements')
      }
      console.error('Erreur lors du chargement des établissements:', error)
      setEsts([])
    }
  }
  useEffect(()=>{ load(); loadEsts() },[])

  /** Ouverture du modal d'édition avec pré-remplissage. */
  const openEditModal = (s: Service) => {
    setEditing(s)
    setEditForm({
      establishment_id: s.establishment?.id || 0,
      name: s.name,
      avg_service_time_minutes: s.avg_service_time_minutes || 5,
      status: s.status || 'open',
      priority_support: !!s.priority_support,
      capacity: (s as any).capacity ?? null,
    })
    setOpenEdit(true)
  }

  /** Création d'un service. */
  const createService = async () => {
    setCreateErrors({})
    const parsed = serviceSchema.safeParse({ ...createForm })
    if (!parsed.success) {
      const errs: Record<string,string> = {}
      parsed.error.issues.forEach(i=>{ if(i.path[0]) errs[String(i.path[0])] = i.message })
      setCreateErrors(errs); toast.error('Veuillez corriger le formulaire'); return
    }
    try {
      const response = await api.post('/api/admin/services', parsed.data)
      toast.success('Service créé avec succès')
      setOpenCreate(false)
      setCreateForm({ establishment_id: 0, name:'', avg_service_time_minutes:5, status:'open', priority_support:false, capacity: null })
      load()
    } catch(e:any) {
      const status = e?.response?.status
      const message = e?.response?.data?.error?.message || e?.response?.data?.message
      
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Permission refusée pour créer un service.')
      } else if (status === 422) {
        toast.error(message || 'Données invalides. Veuillez vérifier le formulaire.')
      } else if (status >= 500) {
        toast.error('Erreur serveur lors de la création.')
      } else {
        toast.error(message || 'Erreur de création')
      }
    }
  }

  /** Mise à jour d'un service. */
  const updateService = async () => {
    if (!editing) return
    setEditErrors({})
    const parsed = serviceSchema.safeParse({ ...editForm })
    if (!parsed.success) {
      const errs: Record<string,string> = {}
      parsed.error.issues.forEach(i=>{ if(i.path[0]) errs[String(i.path[0])] = i.message })
      setEditErrors(errs); toast.error('Veuillez corriger le formulaire'); return
    }
    try {
      const response = await api.put(`/api/admin/services/${editing.id}`, parsed.data)
      toast.success('Service mis à jour avec succès')
      setOpenEdit(false)
      setEditing(null)

      // Optimistic UI update if API returns the updated service.
      const updated = response?.data?.data || response?.data
      if (updated && typeof updated === 'object' && updated.id) {
        setRows((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)))
      } else {
        await load()
      }
    } catch(e:any) {
      const status = e?.response?.status
      const message = e?.response?.data?.error?.message || e?.response?.data?.message
      
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Permission refusée pour modifier ce service.')
      } else if (status === 404) {
        toast.error('Service non trouvé.')
      } else if (status === 422) {
        toast.error(message || 'Données invalides. Veuillez vérifier le formulaire.')
      } else if (status >= 500) {
        toast.error('Erreur serveur lors de la mise à jour.')
      } else {
        toast.error(message || 'Erreur de mise à jour')
      }
    }
  }

  /** Génère un QR code pour un service. */
  const generateQrCode = async (service: Service) => {
    setQrLoading(true)
    try {
      const response = await api.post(`/api/admin/services/${service.id}/qr-code`)
      console.log('QR API response:', response.data)
      const qrData = response.data.qr_code
      console.log('qrData:', qrData)
      // Mapper les propriétés de l'API vers le type Service
      const updatedService = { 
        ...service, 
        qr_code_token: qrData.token,
        qr_code_url: qrData.url,
        qr_generated_at: qrData.generated_at,
      }
      console.log('updatedService:', updatedService)
      setQrService(updatedService)
      toast.success('QR code généré avec succès')
      // Update the row in the table
      setRows(prev => prev.map(s => s.id === service.id ? updatedService : s))
    } catch(e: any) {
      console.error('QR generation error:', e)
      const status = e?.response?.status
      const message = e?.response?.data?.message
      if (status === 403) {
        toast.error('Permission refusée')
      } else {
        toast.error(message || 'Erreur lors de la génération du QR code')
      }
    } finally {
      setQrLoading(false)
    }
  }

  /** Ouvre le modal QR code. */
  const openQrModal = async (service: Service) => {
    setQrService(service)
    setOpenQr(true)
    if (!service.qr_code_token) {
      // Générer le QR code si pas encore fait
      await generateQrCode(service)
    }
  }

  /** Télécharge le QR code. */
  const downloadQrCode = async (service: Service) => {
    if (!service.qr_code_url) return
    try {
      // Pour SVG, on peut télécharger directement depuis l'URL
      const response = await api.get(`/api/admin/services/${service.id}/qr-code/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `qr-${service.name}-${service.qr_code_token}.svg`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch(e: any) {
      toast.error('Erreur lors du téléchargement')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Services</h1>
            <p className="text-sm text-muted-foreground">Gérez les services et leurs établissements</p>
          </div>
        </div>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={()=>setOpenCreate(true)}
        >
          <Plus className="h-4 w-4" />
          Nouveau service
        </button>
      </div>

      <div className=" rounded-xl shadow-lg">
        <DataTable columns={[
          { key:'id', header:'ID' },
          { key:'name', header:'Service' },
          { key:'status', header:'Statut', render:(r:Service)=> (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 ring-1 ring-inset ring-green-200 dark:ring-green-800/30' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 ring-1 ring-inset ring-red-200 dark:ring-red-800/30'}`}>
              {r.status}
            </span>
          ) },
          { key:'avg_service_time_minutes', header:'Temps moyen (min)' },
          { key:'capacity', header:'Capacité', render:(r:Service)=> (r.capacity === null || r.capacity === undefined ? '—' : r.capacity) },
          { key:'establishment', header:'Établissement', render:(r:Service)=> r.establishment?.name },
          { key:'actions', header:'Actions', render:(r:Service)=> (
            <div className="flex gap-1">
              <button 
                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" 
                onClick={()=>openQrModal(r)}
                title="QR Code"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
                onClick={()=>openEditModal(r)}
                title="Éditer"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                onClick={async ()=>{
                  if (!confirm(`Supprimer le service ${r.name} ?`)) return
                  try { 
                    await api.delete(`/api/admin/services/${r.id}`); 
                    toast.success('Service supprimé avec succès'); 
                    await load(); 
                  } catch(e:any){ 
                    const status = e?.response?.status
                    const message = e?.response?.data?.error?.message || e?.response?.data?.message
                    
                    if (status === 401) {
                      toast.error('Session expirée. Veuillez vous reconnecter.')
                    } else if (status === 403) {
                      toast.error('Permission refusée pour supprimer ce service.')
                    } else if (status === 404) {
                      toast.error('Service non trouvé.')
                    } else if (status >= 500) {
                      toast.error('Erreur serveur lors de la suppression.')
                    } else {
                      toast.error(message || 'Suppression impossible')
                    }
                  }
                }}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) },
        ]} data={rows} />
      </div>

      {/* Modal Création */}
      <Modal open={openCreate} onClose={()=>setOpenCreate(false)} title="Créer un service">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Établissement</label>
            <select className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.establishment_id} onChange={e=>setCreateForm({...createForm, establishment_id: Number(e.target.value)})}>
              <option value={0}>—</option>
              {ests.map(e=> <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Nom</label>
            <input className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.name} onChange={e=>setCreateForm({...createForm, name:e.target.value})} />
            {createErrors.name && <p className="text-xs text-destructive">{createErrors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Temps moyen (min)</label>
            <input type="number" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.avg_service_time_minutes} onChange={e=>setCreateForm({...createForm, avg_service_time_minutes:Number(e.target.value)})} />
            {createErrors.avg_service_time_minutes && <p className="text-xs text-destructive">{createErrors.avg_service_time_minutes}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Capacité (max tickets)</label>
            <input
              type="number"
              className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              value={createForm.capacity ?? ''}
              onChange={e=>setCreateForm({...createForm, capacity: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="(illimité)"
            />
            {createErrors.capacity && <p className="text-xs text-destructive">{createErrors.capacity}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Statut</label>
            <select className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.status} onChange={e=>setCreateForm({...createForm, status:e.target.value})}>
              <option value="open">Ouvert</option>
              <option value="closed">Fermé</option>
            </select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <input type="checkbox" checked={createForm.priority_support} onChange={e=>setCreateForm({...createForm, priority_support: e.target.checked})} />
            <span>Support prioritaire</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-md transition-colors" onClick={()=>setOpenCreate(false)}>Annuler</button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors" onClick={createService}>Créer</button>
        </div>
      </Modal>

      {/* Modal Édition */}
      <Modal open={openEdit} onClose={()=>setOpenEdit(false)} title={`Éditer le service ${editing?.name ?? ''}`}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Établissement</label>
            <select className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.establishment_id} onChange={e=>setEditForm({...editForm, establishment_id: Number(e.target.value)})}>
              <option value={0}>—</option>
              {ests.map(e=> <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Nom</label>
            <input className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
            {editErrors.name && <p className="text-xs text-destructive">{editErrors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Temps moyen (min)</label>
            <input type="number" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.avg_service_time_minutes} onChange={e=>setEditForm({...editForm, avg_service_time_minutes:Number(e.target.value)})} />
            {editErrors.avg_service_time_minutes && <p className="text-xs text-destructive">{editErrors.avg_service_time_minutes}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Capacité (max tickets)</label>
            <input
              type="number"
              className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              value={editForm.capacity ?? ''}
              onChange={e=>setEditForm({...editForm, capacity: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="(illimité)"
            />
            {editErrors.capacity && <p className="text-xs text-destructive">{editErrors.capacity}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Statut</label>
            <select className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})}>
              <option value="open">Ouvert</option>
              <option value="closed">Fermé</option>
            </select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <input type="checkbox" checked={editForm.priority_support} onChange={e=>setEditForm({...editForm, priority_support: e.target.checked})} />
            <span>Support prioritaire</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-md transition-colors" onClick={()=>setOpenEdit(false)}>Annuler</button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors" onClick={updateService}>Enregistrer</button>
        </div>
      </Modal>

      {/* Modal QR Code */}
      <Modal open={openQr} onClose={()=>setOpenQr(false)} title={`QR Code - ${qrService?.name ?? ''}`}>
        <div className="flex flex-col items-center space-y-4">
          {qrLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : qrService?.qr_code_url ? (
            <>
              <img 
                src={qrService.qr_code_url} 
                alt={`QR Code ${qrService.name}`}
                className="w-48 h-48 object-contain border border-border rounded-lg"
              />
              <div className="text-center">
                <p className="font-semibold text-foreground">{qrService.name}</p>
                <p className="text-sm text-muted-foreground">{qrService.establishment?.name}</p>
                {qrService.qr_generated_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Généré le {new Date(qrService.qr_generated_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                  onClick={()=>generateQrCode(qrService)}
                >
                  <QrCode className="h-4 w-4" />
                  Régénérer
                </button>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-md transition-colors"
                  onClick={()=>downloadQrCode(qrService)}
                >
                  <Download className="h-4 w-4" />
                  Télécharger SVG
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Ce QR code est permanent. Il encode: vqs://service/{qrService.qr_code_token?.substring(0, 8)}...
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun QR code généré</p>
              <button
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                onClick={()=>qrService && generateQrCode(qrService)}
              >
                <QrCode className="h-4 w-4" />
                Générer le QR code
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
