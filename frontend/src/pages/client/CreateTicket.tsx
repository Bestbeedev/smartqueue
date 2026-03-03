import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Establishment = {
  id: number
  name: string
}

type Service = {
  id: number
  name: string
  establishment_id: number
}

type TicketResponse = any

export default function CreateTicket() {
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [establishmentId, setEstablishmentId] = useState<string>('')
  const [serviceId, setServiceId] = useState<string>('')

  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')

  const [loading, setLoading] = useState({ init: true, services: false, submit: false })

  useEffect(() => {
    ;(async () => {
      try {
        setLoading((p) => ({ ...p, init: true }))
        const { data } = await api.get('/api/establishments')
        const list: Establishment[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : []
        setEstablishments(list)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || e?.message || 'Impossible de charger les établissements')
      } finally {
        setLoading((p) => ({ ...p, init: false }))
      }
    })()
  }, [])

  useEffect(() => {
    if (!establishmentId) return

    ;(async () => {
      try {
        setLoading((p) => ({ ...p, services: true }))
        setServices([])
        setServiceId('')

        const { data } = await api.get(`/api/establishments/${Number(establishmentId)}/services`)
        const list: Service[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : []
        setServices(list)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || e?.message || 'Impossible de charger les services')
      } finally {
        setLoading((p) => ({ ...p, services: false }))
      }
    })()
  }, [establishmentId])

  const selectedService = useMemo(() => {
    const sid = Number(serviceId)
    if (!sid) return null
    return services.find((s) => s.id === sid) || null
  }, [serviceId, services])

  const createTicket = async () => {
    if (!serviceId) {
      toast.error('Sélectionnez un service')
      return
    }

    setLoading((p) => ({ ...p, submit: true }))
    try {
      const payload: any = {
        service_id: Number(serviceId),
      }
      if (lat) payload.lat = Number(lat)
      if (lng) payload.lng = Number(lng)

      const { data } = await api.post<TicketResponse>('/api/tickets', payload)
      toast.success('Ticket créé')
      console.log('Ticket créé:', data)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Impossible de créer le ticket')
    } finally {
      setLoading((p) => ({ ...p, submit: false }))
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Espace client - Créer un ticket</h1>
          <p className="text-sm text-muted-foreground">
            Un ticket est toujours lié à un service (et donc indirectement à un établissement).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Établissement</Label>
            <Select value={establishmentId} onValueChange={setEstablishmentId}>
              <SelectTrigger disabled={loading.init}>
                <SelectValue placeholder={loading.init ? 'Chargement…' : 'Sélectionner un établissement'} />
              </SelectTrigger>
              <SelectContent>
                {establishments.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger disabled={!establishmentId || loading.services}>
                <SelectValue
                  placeholder={
                    !establishmentId
                      ? 'Choisissez un établissement d’abord'
                      : loading.services
                        ? 'Chargement…'
                        : 'Sélectionner un service'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <p className="text-xs text-muted-foreground">Service #{selectedService.id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Latitude (optionnel)</Label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="ex: 48.8566" />
          </div>
          <div className="space-y-2">
            <Label>Longitude (optionnel)</Label>
            <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="ex: 2.3522" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={createTicket} disabled={loading.submit || !serviceId}>
            {loading.submit ? 'Création…' : 'Créer le ticket'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Endpoint utilisé: POST /api/tickets (auth required)
        </div>
      </Card>
    </div>
  )
}
