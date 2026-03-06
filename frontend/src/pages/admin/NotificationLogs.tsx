import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

type LogItem = {
  id: number
  ticket_id?: number | null
  channel: 'push' | 'sms'
  type: string
  status: 'queued' | 'sent' | 'failed'
  payload?: any
  sent_at?: string | null
  created_at?: string
}

export default function NotificationLogs() {
  const [items, setItems] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [channel, setChannel] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [type, setType] = useState('')

  const [selected, setSelected] = useState<LogItem | null>(null)
  const [editType, setEditType] = useState('')
  const [editPayload, setEditPayload] = useState('')
  const [saving, setSaving] = useState(false)

  const params = useMemo(() => {
    const p: any = { per_page: 50 }
    if (channel !== 'all') p.channel = channel
    if (status !== 'all') p.status = status
    if (type.trim()) p.type = type.trim()
    return p
  }, [channel, status, type])

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/admin/notification-logs', { params })
      const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setItems(arr)
    } catch (e: any) {
      setItems([])
      setError(e?.response?.data?.message || e?.message || 'Erreur chargement logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const openItem = async (id: number) => {
    setSelected(null)
    setEditType('')
    setEditPayload('')
    try {
      const { data } = await api.get(`/api/admin/notification-logs/${id}`)
      setSelected(data)
      setEditType(String(data?.type ?? ''))
      setEditPayload(JSON.stringify(data?.payload ?? {}, null, 2))
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur chargement détail')
    }
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const payloadObj = editPayload.trim() ? JSON.parse(editPayload) : {}
      const { data } = await api.patch(`/api/admin/notification-logs/${selected.id}`, {
        type: editType,
        payload: payloadObj,
      })
      setSelected(data)
      await fetchLogs()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historique des notifications envoyées</h1>
          <p className="text-muted-foreground">Logs push/SMS (audit). La modification ne renvoie pas une notification déjà envoyée.</p>
        </div>
        <Button variant="outline" onClick={() => history.back()}>Retour</Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select className="w-40 rounded-md border border-border bg-background px-3 py-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="all">Tous canaux</option>
              <option value="push">push</option>
              <option value="sms">sms</option>
            </select>
            <select className="w-40 rounded-md border border-border bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Tous statuts</option>
              <option value="queued">queued</option>
              <option value="sent">sent</option>
              <option value="failed">failed</option>
            </select>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Filtrer par type (approaching, called, admin_broadcast, ...)" />
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>Rafraîchir</Button>
          </div>
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Aucun log</div>
              ) : (
                items.map((it) => (
                  <button
                    type="button"
                    key={it.id}
                    className="w-full text-left p-4 hover:bg-accent transition-colors"
                    onClick={() => openItem(it.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-foreground">#{it.id} • {it.channel} • {it.status}</div>
                      <div className="text-xs text-muted-foreground">{it.created_at || ''}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">type: {it.type}{it.ticket_id ? ` • ticket_id: ${it.ticket_id}` : ''}</div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            {!selected ? (
              <div className="text-sm text-muted-foreground">Sélectionne un log pour voir/modifier.</div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">Log #{selected.id}</div>
                <div>
                  <label className="text-sm font-medium text-foreground">Type</label>
                  <Input value={editType} onChange={(e) => setEditType(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Payload (JSON)</label>
                  <textarea
                    className="mt-1 w-full min-h-56 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                    value={editPayload}
                    onChange={(e) => setEditPayload(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={save} disabled={saving}> {saving ? 'Sauvegarde…' : 'Sauvegarder'} </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
