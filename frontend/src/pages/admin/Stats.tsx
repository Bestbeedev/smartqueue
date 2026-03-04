/**
 * Statistiques (Admin)
 * - Vue d'ensemble (overview) et statistiques par service.
 * - Consomme /api/admin/stats/overview et /api/admin/stats/services/{id}
 */
import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

export default function Stats(){
  const [overview, setOverview] = useState<any>(null)
  const [serviceId, setServiceId] = useState<number | ''>('' as any)
  const [serviceStats, setServiceStats] = useState<any>(null)
  const [bucket, setBucket] = useState<'day' | 'hour'>('day')
  const [series, setSeries] = useState<any[]>([])
  const [isSeriesLoading, setIsSeriesLoading] = useState(false)
  const [seriesError, setSeriesError] = useState<string>('')

  useEffect(()=>{ api.get('/api/admin/stats/overview').then(r=>setOverview(r.data)).catch(()=>setOverview(null)) },[])
  useEffect(()=>{
    if (!serviceId) {
      setServiceStats(null)
      return
    }
    api.get(`/api/admin/stats/services/${serviceId}`).then(r=>setServiceStats(r.data)).catch(()=>setServiceStats(null))
  },[serviceId])

  useEffect(() => {
    setIsSeriesLoading(true)
    setSeriesError('')
    const params: any = { bucket }
    if (serviceId) params.service_id = serviceId
    api.get('/api/admin/stats/series', { params })
      .then((r) => {
        const rows = Array.isArray(r.data?.series) ? r.data.series : []
        setSeries(rows)
        setIsSeriesLoading(false)
      })
      .catch((e) => {
        setSeries([])
        setIsSeriesLoading(false)
        setSeriesError(e?.message || 'Erreur lors du chargement de la série')
      })
  }, [bucket, serviceId])

  return (
    <div className="space-y-4">
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

      <div className="bg-card rounded-xl shadow-lg border border-border p-6">
        <div className="text-lg font-semibold text-foreground mb-4">Statistiques par service</div>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input className="w-40 rounded-md border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={serviceId as any} onChange={e=>setServiceId(Number(e.target.value)||'' as any)} placeholder="Service ID" />
            <select className="w-40 rounded-md border-border bg-background px-3 py-2 text-sm" value={bucket} onChange={e=>setBucket(e.target.value as any)}>
              <option value="day">Par jour</option>
              <option value="hour">Par heure</option>
            </select>
          </div>
          {serviceStats && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-card rounded-xl shadow-lg border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Créés</div>
                <div className="text-2xl font-bold text-foreground">{serviceStats.tickets?.created ?? '—'}</div>
              </div>
              <div className="bg-card rounded-xl shadow-lg border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Clos</div>
                <div className="text-2xl font-bold text-foreground">{serviceStats.tickets?.closed ?? '—'}</div>
              </div>
              <div className="bg-card rounded-xl shadow-lg border border-border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Absents</div>
                <div className="text-2xl font-bold text-foreground">{serviceStats.tickets?.absent ?? '—'}</div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Évolution (créés / clos / absents)</div>
            <div className="h-72">
              {isSeriesLoading ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
              ) : seriesError ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-destructive">{seriesError}</div>
              ) : series.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée sur la période
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={false} name="Créés" />
                    <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} dot={false} name="Clos" />
                    <Line type="monotone" dataKey="absent" stroke="#f59e0b" strokeWidth={2} dot={false} name="Absents" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
