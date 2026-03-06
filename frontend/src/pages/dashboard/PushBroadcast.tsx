import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/api/axios'

export default function PushBroadcast() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ users_targeted?: number } | null>(null)
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.post('/api/admin/push/broadcast', {
        title,
        body,
        data: {
          type: 'admin_broadcast',
          screen: 'notifications',
        },
      })
      setResult(data)
      setTitle('')
      setBody('')
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-card rounded-xl shadow-lg border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Push notifications (Firebase)</h1>
            <p className="text-muted-foreground">
              Publie une annonce push à tous les utilisateurs mobiles ayant activé les notifications.
            </p>
          </div>
          <Button variant="outline" onClick={() => history.back()}>
            Retour
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Titre</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Message</label>
            <Input value={body} onChange={(e) => setBody(e.target.value)} className="mt-1" />
          </div>

          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          {result ? (
            <div className="text-sm text-emerald-600">
              Notification mise en file d'attente. Utilisateurs ciblés: {result.users_targeted ?? 0}
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button onClick={submit} disabled={loading || !title.trim() || !body.trim()}>
              {loading ? 'Envoi…' : 'Publier'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
