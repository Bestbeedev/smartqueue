import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/axios'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Button } from '@/components/ui/button'

export default function Analytics() {
  const [bucket, setBucket] = useState<'day' | 'hour'>('day')
  const [serviceId, setServiceId] = useState<number | ''>('' as any)
  const [series, setSeries] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const params = useMemo(() => {
    const p: any = { bucket }
    if (serviceId) p.service_id = serviceId
    return p
  }, [bucket, serviceId])

  useEffect(() => {
    api.get('/api/admin/stats/overview')
      .then((r) => setOverview(r.data))
      .catch(() => setOverview(null))
  }, [])

  useEffect(() => {
    setLoading(true)
    setErr('')
    api.get('/api/admin/stats/series', { params })
      .then((r) => {
        setSeries(Array.isArray(r.data?.series) ? r.data.series : [])
        setLoading(false)
      })
      .catch((e) => {
        setSeries([])
        setLoading(false)
        setErr(e?.message || 'Erreur lors du chargement des analytics')
      })
  }, [params])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Analytics</h1>
          <p className="text-muted-foreground">Vue complète des indicateurs sur la période.</p>
        </div>
        <Button variant="outline" onClick={() => history.back()}>Retour</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Créés</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.created ?? '—'}</div>
        </div>
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Clos</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.closed ?? '—'}</div>
        </div>
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Absents</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.absent ?? '—'}</div>
        </div>
        <div className="bg-card rounded-xl shadow-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Attente moyenne</div>
          <div className="text-2xl font-bold text-foreground">{overview?.tickets?.wait_avg_minutes ?? '—'} min</div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-lg border border-border p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-semibold text-foreground">Évolution</div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select className="w-40 rounded-md border border-border bg-background px-3 py-2 text-sm" value={bucket} onChange={(e) => setBucket(e.target.value as any)}>
              <option value="day">Par jour</option>
              <option value="hour">Par heure</option>
            </select>
            <input className="w-40 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={serviceId as any} onChange={e => setServiceId(Number(e.target.value) || '' as any)} placeholder="Service ID (optionnel)" />
          </div>
        </div>

        <div className="h-96">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
          ) : err ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-destructive">{err}</div>
          ) : series.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={false} name="Créés" />
                <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} dot={false} name="Clos" />
                <Line type="monotone" dataKey="absent" stroke="#f59e0b" strokeWidth={2} dot={false} name="Absents" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
