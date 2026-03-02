import { useEffect, useState } from 'react'
import { api } from '@/api/axios'

export default function SaasMonitoring() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/api/saas/monitoring/overview')
      setData(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading && !data) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h1 className="text-lg font-semibold">Monitoring SaaS</h1>
        <p className="text-sm text-gray-500">Vue globale plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><div className="card-header">Établissements</div><div className="card-body text-2xl font-bold">{data?.establishments ?? '—'}</div></div>
        <div className="card"><div className="card-header">Services ouverts</div><div className="card-body text-2xl font-bold">{data?.services?.open ?? '—'}</div></div>
        <div className="card"><div className="card-header">Guichets ouverts</div><div className="card-body text-2xl font-bold">{data?.counters?.open ?? '—'}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><div className="card-header">Tickets en attente</div><div className="card-body text-2xl font-bold">{data?.tickets?.waiting ?? '—'}</div></div>
        <div className="card"><div className="card-header">Tickets appelés</div><div className="card-body text-2xl font-bold">{data?.tickets?.called ?? '—'}</div></div>
        <div className="card"><div className="card-header">Tickets absents</div><div className="card-body text-2xl font-bold">{data?.tickets?.absent ?? '—'}</div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Subscriptions</h2>
          <button className="btn btn-secondary" onClick={load}>Rafraîchir</button>
        </div>
        <pre className="mt-3 text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data?.subscriptions_by_status ?? {}, null, 2)}</pre>
      </div>
    </div>
  )
}
