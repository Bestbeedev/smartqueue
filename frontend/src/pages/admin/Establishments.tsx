/**
 * Établissements (Admin)
 * Modals de création/édition pour gérer les établissements.
 * - GET /api/admin/establishments
 * - POST /api/admin/establishments
 * - PUT /api/admin/establishments/{id}
 * Champs: name, address, lat, lng, open_at, close_at, is_active
 */
import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { z } from 'zod'
import { toast } from 'sonner'
import { Edit, Pencil, Trash2 } from 'lucide-react'

type Establishment = { id:number; name:string; address?:string|null; lat?:number|null; lng?:number|null; open_at?:string|null; close_at?:string|null; is_active?:boolean }

export default function Establishments(){
  const [rows, setRows] = useState<Establishment[]>([])
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<Establishment | null>(null)
  const [loading, setLoading] = useState(false)

  const [createForm, setCreateForm] = useState<Establishment>({ id:0, name:'', address:'', lat:null, lng:null, open_at:'', close_at:'', is_active:true })
  const [editForm, setEditForm] = useState<Establishment>({ id:0, name:'', address:'', lat:null, lng:null, open_at:'', close_at:'', is_active:true })
  const [createErrors, setCreateErrors] = useState<Record<string,string>>({})
  const [editErrors, setEditErrors] = useState<Record<string,string>>({})

  // Validation Zod pour établissement
  const estSchema = z.object({
    name: z.string().min(2, 'Nom trop court'),
    address: z.string().optional(),
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
    open_at: z.string().optional(),
    close_at: z.string().optional(),
    is_active: z.boolean().optional()
  })

  const load = async () => {
    if (loading) return // Éviter les appels multiples
    setLoading(true)
    try {
      const response = await api.get('/api/admin/establishments?per_page=50')
      const data = response.data.data || response.data
      setRows(Array.isArray(data) ? data : [])
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
        toast.error('Impossible de charger les établissements')
      }
      console.error('Erreur lors du chargement des établissements:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ load() },[])

  /** Ouvre le modal d'édition avec données existantes. */
  const openEditModal = (e: Establishment) => {
    setEditing(e)
    setEditForm({
      id: e.id,
      name: e.name,
      address: e.address || '',
      lat: e.lat ?? null,
      lng: e.lng ?? null,
      open_at: e.open_at || '',
      close_at: e.close_at || '',
      is_active: e.is_active ?? true
    })
    setOpenEdit(true)
  }

  /** Création d'un établissement. */
  const createEst = async () => {
    setCreateErrors({})
    const { id, ...payload } = createForm
    const parsed = estSchema.safeParse(payload)
    if (!parsed.success) {
      const errs: Record<string,string> = {}
      parsed.error.issues.forEach(i=>{ if(i.path[0]) errs[String(i.path[0])] = i.message })
      setCreateErrors(errs); toast.error('Veuillez corriger le formulaire'); return
    }
    try {
      const response = await api.post('/api/admin/establishments', parsed.data)
      toast.success('Établissement créé avec succès')
      setOpenCreate(false)
      setCreateForm({ id:0, name:'', address:'', lat:null, lng:null, open_at:'', close_at:'', is_active:true })
      await load()
    } catch(e:any) {
      const status = e?.response?.status
      const message = e?.response?.data?.error?.message || e?.response?.data?.message
      
      if (status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
      } else if (status === 403) {
        toast.error('Permission refusée pour créer un établissement.')
      } else if (status === 422) {
        toast.error(message || 'Données invalides. Veuillez vérifier le formulaire.')
      } else if (status >= 500) {
        toast.error('Erreur serveur lors de la création.')
      } else {
        toast.error(message || 'Erreur de création')
      }
    }
  }

  /** Mise à jour d'un établissement. */
  const updateEst = async () => {
    if (!editing) return
    setEditErrors({})
    const { id, ...payload } = editForm
    const parsed = estSchema.safeParse(payload)
    if (!parsed.success) {
      const errs: Record<string,string> = {}
      parsed.error.issues.forEach(i=>{ if(i.path[0]) errs[String(i.path[0])] = i.message })
      setEditErrors(errs); toast.error('Veuillez corriger le formulaire'); return
    }
    try {
      const response = await api.put(`/api/admin/establishments/${editing.id}`, parsed.data)
      toast.success('Établissement mis à jour avec succès')
      setOpenEdit(false)
      setEditing(null)
      await load()
    } catch(e:any) {
      const status = e?.response?.status
      const message = e?.response?.data?.error?.message || e?.response?.data?.message
      
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Établissements</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors" onClick={()=>setOpenCreate(true)}>Nouvel établissement</button>
      </div>

      <DataTable columns={[
        { key:'id', header:'ID' },
        { key:'name', header:'Nom' },
        { key:'address', header:'Adresse' },
        { key:'is_active', header:'Actif', render:(r:Establishment)=> (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 ring-1 ring-inset ring-green-200 dark:ring-green-800/30' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 ring-1 ring-inset ring-red-200 dark:ring-red-800/30'}`}>
            {r.is_active ? 'Actif' : 'Inactif'}
          </span>
        ) },
        { key:'actions', header:'Actions', render:(r:Establishment)=> (
          <div className="flex gap-1">
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
                if (!confirm(`Supprimer l'établissement ${r.name} ?`)) return
                try { 
                  await api.delete(`/api/admin/establishments/${r.id}`); 
                  toast.success('Établissement supprimé avec succès'); 
                  await load(); 
                } catch(e:any){ 
                  const status = e?.response?.status
                  const message = e?.response?.data?.error?.message || e?.response?.data?.message
                  
                  if (status === 401) {
                    toast.error('Session expirée. Veuillez vous reconnecter.')
                  } else if (status === 403) {
                    toast.error('Permission refusée pour supprimer cet établissement.')
                  } else if (status === 404) {
                    toast.error('Établissement non trouvé.')
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
        )},
      ]} data={rows} />

      {/* Modal Création */}
      <Modal open={openCreate} onClose={()=>setOpenCreate(false)} title="Créer un établissement">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Nom</label>
            <input className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.name} onChange={e=>setCreateForm({...createForm, name:e.target.value})} />
            {createErrors.name && <p className="text-xs text-destructive">{createErrors.name}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground">Adresse</label>
            <input className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.address ?? ''} onChange={e=>setCreateForm({...createForm, address:e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Latitude</label>
            <input type="number" step="any" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.lat ?? ''} onChange={e=>setCreateForm({...createForm, lat: e.target.value===''? null : Number(e.target.value)})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Longitude</label>
            <input type="number" step="any" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.lng ?? ''} onChange={e=>setCreateForm({...createForm, lng: e.target.value===''? null : Number(e.target.value)})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Ouverture</label>
            <input placeholder="08:00:00" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.open_at ?? ''} onChange={e=>setCreateForm({...createForm, open_at:e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Fermeture</label>
            <input placeholder="17:00:00" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={createForm.close_at ?? ''} onChange={e=>setCreateForm({...createForm, close_at:e.target.value})} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <input type="checkbox" checked={!!createForm.is_active} onChange={e=>setCreateForm({...createForm, is_active: e.target.checked})} />
            <span>Actif</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-md transition-colors" onClick={()=>setOpenCreate(false)}>Annuler</button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors" onClick={createEst}>Créer</button>
        </div>
      </Modal>

      {/* Modal Édition */}
      <Modal open={openEdit} onClose={()=>setOpenEdit(false)} title={`Éditer ${editing?.name ?? ''}`}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Nom</label>
            <input className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
            {editErrors.name && <p className="text-xs text-destructive">{editErrors.name}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground">Adresse</label>
            <input className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.address ?? ''} onChange={e=>setEditForm({...editForm, address:e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Latitude</label>
            <input type="number" step="any" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.lat ?? ''} onChange={e=>setEditForm({...editForm, lat: e.target.value===''? null : Number(e.target.value)})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Longitude</label>
            <input type="number" step="any" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.lng ?? ''} onChange={e=>setEditForm({...editForm, lng: e.target.value===''? null : Number(e.target.value)})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Ouverture</label>
            <input placeholder="08:00:00" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.open_at ?? ''} onChange={e=>setEditForm({...editForm, open_at:e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Fermeture</label>
            <input placeholder="17:00:00" className="w-full rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={editForm.close_at ?? ''} onChange={e=>setEditForm({...editForm, close_at:e.target.value})} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <input type="checkbox" checked={!!editForm.is_active} onChange={e=>setEditForm({...editForm, is_active: e.target.checked})} />
            <span>Actif</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-md transition-colors" onClick={()=>setOpenEdit(false)}>Annuler</button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors" onClick={updateEst}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  )
}
