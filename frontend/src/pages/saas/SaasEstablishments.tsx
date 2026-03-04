import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { toast } from 'sonner'

type Establishment = {
  id: number
  name: string
  address?: string | null
  is_active?: boolean
  subscription?: { id: number; plan: string; status: string } | null
}

export default function SaasEstablishments() {
  const [rows, setRows] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (loading) return // Éviter les appels multiples
    setLoading(true)
    try {
      const response = await api.get('/api/saas/establishments?per_page=50')
      const list = response.data?.data || response.data
      setRows(Array.isArray(list) ? list : [])
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
        toast.error('Impossible de charger les établissements')
      }
      console.error('Erreur lors du chargement des établissements:', error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h1 className="text-lg font-semibold">Clients (Établissements)</h1>
        <p className="text-sm text-gray-500">Gestion multi-établissements</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Liste</h2>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>Rafraîchir</button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">ID</th>
                <th>Nom</th>
                <th>Actif</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.id}</td>
                  <td>{r.name}</td>
                  <td>{String(r.is_active ?? true)}</td>
                  <td>{r.subscription?.plan ?? '—'}</td>
                  <td>{r.subscription?.status ?? '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-4 text-gray-500" colSpan={5}>Aucun établissement</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
