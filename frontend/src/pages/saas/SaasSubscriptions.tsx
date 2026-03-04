import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { toast } from 'sonner'

type Subscription = {
  id: number
  establishment_id: number
  plan: string
  status: string
  current_period_start?: string | null
  current_period_end?: string | null
  establishment?: { id: number; name: string }
}

export default function SaasSubscriptions() {
  const [rows, setRows] = useState<Subscription[]>([])
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (loading) return // Éviter les appels multiples
    setLoading(true)
    try {
      const response = await api.get('/api/saas/subscriptions', { 
        params: { per_page: 50, status: status || undefined, plan: plan || undefined } 
      })
      const data = response.data?.data || response.data
      setRows(Array.isArray(data) ? data : [])
      // Pas de toast ici pour éviter les messages au chargement initial
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
        toast.error('Impossible de charger les abonnements')
      }
      console.error('Erreur lors du chargement des abonnements:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h1 className="text-lg font-semibold">Abonnements</h1>
        <p className="text-sm text-gray-500">Vue paginée des subscriptions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <div className="flex gap-2">
          <input className="rounded-md border-gray-300" placeholder="status (active...)" value={status} onChange={(e) => setStatus(e.target.value)} />
          <input className="rounded-md border-gray-300" placeholder="plan (pro...)" value={plan} onChange={(e) => setPlan(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>Filtrer</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">ID</th>
                <th>Établissement</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Période</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.id}</td>
                  <td>{r.establishment?.name ?? r.establishment_id}</td>
                  <td>{r.plan}</td>
                  <td>{r.status}</td>
                  <td>{r.current_period_start ?? '—'} → {r.current_period_end ?? '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-4 text-gray-500" colSpan={5}>Aucun abonnement</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
