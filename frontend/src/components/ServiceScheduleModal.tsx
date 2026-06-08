/**
 * ServiceScheduleModal
 * Admin UI to configure a service's:
 *  - opening / closing hours
 *  - average processing time (minutes)
 *  - working days (Mon..Sun activation + per-day overrides)
 *  - holidays / exceptional closures / temporary unavailabilities
 *
 * Source of truth = backend. All edits are persisted via the admin schedule API.
 */
import { useEffect, useMemo, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Plus, Trash2, CalendarDays, Clock, Timer } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from 'sonner'

type WorkingDay = {
  id?: number
  day_of_week: number // 1=Mon..7=Sun
  is_open: boolean
  opening_time: string | null
  closing_time: string | null
}

type ExceptionRow = {
  id?: number
  date: string // YYYY-MM-DD
  type: 'holiday' | 'closure' | 'unavailable'
  label: string | null
  is_closed: boolean
  starts_at: string | null
  ends_at: string | null
  recurring_yearly: boolean
}

type Schedule = {
  service_id: number
  name: string
  status: string
  opening_time: string | null
  closing_time: string | null
  avg_service_time_minutes: number
  working_days: WorkingDay[]
  exceptions: ExceptionRow[]
  availability: {
    is_open_now: boolean
    reason_if_closed: string | null
    opening_time: string
    closing_time: string
    next_opening: string | null
  }
}

const DAY_LABELS: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
}

const REASON_LABELS: Record<string, string> = {
  manually_closed: 'Fermé manuellement',
  holiday: 'Jour férié',
  exceptional_closure: 'Fermeture exceptionnelle',
  temporarily_unavailable: 'Indisponibilité temporaire',
  day_off: 'Jour non ouvré',
  outside_hours: 'Hors horaires d\'ouverture',
}

/** Strip ":SS" if present so it fits an <input type="time"> (HH:MM). */
function toHHMM(value: string | null | undefined): string {
  if (!value) return ''
  return value.length >= 5 ? value.substring(0, 5) : value
}

type Props = {
  open: boolean
  onClose: () => void
  serviceId: number | null
}

export default function ServiceScheduleModal({ open, onClose, serviceId }: Props) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // local edit state (mirrors backend, applied via Save)
  const [openingTime, setOpeningTime] = useState('')
  const [closingTime, setClosingTime] = useState('')
  const [avgMinutes, setAvgMinutes] = useState(5)
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([])

  // exception form
  const [newException, setNewException] = useState<Omit<ExceptionRow, 'id'>>({
    date: '',
    type: 'holiday',
    label: '',
    is_closed: true,
    starts_at: null,
    ends_at: null,
    recurring_yearly: false,
  })

  const fetchSchedule = async (id: number) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/admin/services/${id}/schedule`)
      const sch: Schedule = data.data
      setSchedule(sch)
      setOpeningTime(toHHMM(sch.opening_time))
      setClosingTime(toHHMM(sch.closing_time))
      setAvgMinutes(sch.avg_service_time_minutes || 5)
      // ensure all 7 days exist in order
      const byDay = new Map(sch.working_days.map(wd => [wd.day_of_week, wd]))
      const days: WorkingDay[] = []
      for (let d = 1; d <= 7; d++) {
        const found = byDay.get(d)
        days.push(found ?? { day_of_week: d, is_open: d <= 5, opening_time: null, closing_time: null })
      }
      setWorkingDays(days)
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 403) toast.error('Permission refusée')
      else if (status === 404) toast.error('Service introuvable')
      else toast.error('Impossible de charger la configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && serviceId) {
      fetchSchedule(serviceId)
    } else {
      setSchedule(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId])

  const saveScheduleBulk = async () => {
    if (!serviceId) return
    if (openingTime >= closingTime) {
      toast.error('L\'heure d\'ouverture doit précéder l\'heure de fermeture')
      return
    }
    setSaving(true)
    try {
      const payload = {
        opening_time: openingTime,
        closing_time: closingTime,
        avg_service_time_minutes: avgMinutes,
        working_days: workingDays.map(wd => ({
          day_of_week: wd.day_of_week,
          is_open: wd.is_open,
          opening_time: wd.opening_time ? toHHMM(wd.opening_time) : null,
          closing_time: wd.closing_time ? toHHMM(wd.closing_time) : null,
        })),
      }
      const { data } = await api.put(`/api/admin/services/${serviceId}/schedule`, payload)
      setSchedule(data.data)
      toast.success('Configuration enregistrée')
    } catch (e: any) {
      const status = e?.response?.status
      const message = e?.response?.data?.message
      if (status === 422) toast.error(message || 'Données invalides')
      else if (status === 403) toast.error('Permission refusée')
      else toast.error(message || 'Erreur d\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const addException = async () => {
    if (!serviceId) return
    if (!newException.date) {
      toast.error('Date requise')
      return
    }
    if (!newException.is_closed && (!newException.starts_at || !newException.ends_at)) {
      toast.error('Indisponibilité partielle : heures de début et fin requises')
      return
    }
    try {
      const payload: any = {
        date: newException.date,
        type: newException.type,
        label: newException.label || null,
        is_closed: newException.is_closed,
        recurring_yearly: newException.recurring_yearly,
      }
      if (!newException.is_closed) {
        payload.starts_at = toHHMM(newException.starts_at!)
        payload.ends_at = toHHMM(newException.ends_at!)
      }
      await api.post(`/api/admin/services/${serviceId}/exceptions`, payload)
      toast.success('Exception ajoutée')
      setNewException({
        date: '', type: 'holiday', label: '', is_closed: true,
        starts_at: null, ends_at: null, recurring_yearly: false,
      })
      await fetchSchedule(serviceId)
    } catch (e: any) {
      const message = e?.response?.data?.message
      toast.error(message || 'Erreur lors de l\'ajout')
    }
  }

  const deleteException = async (exceptionId: number) => {
    if (!serviceId) return
    if (!confirm('Supprimer cette exception ?')) return
    try {
      await api.delete(`/api/admin/services/${serviceId}/exceptions/${exceptionId}`)
      toast.success('Exception supprimée')
      await fetchSchedule(serviceId)
    } catch (e: any) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const availabilityBadge = useMemo(() => {
    if (!schedule) return null
    const a = schedule.availability
    if (a.is_open_now) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
          Ouvert maintenant
        </span>
      )
    }
    const label = a.reason_if_closed ? (REASON_LABELS[a.reason_if_closed] || a.reason_if_closed) : 'Fermé'
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
        {label}
      </span>
    )
  }, [schedule])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center overflow-y-auto">
          <DialogPrimitive.Content
            className="z-50 w-full max-w-3xl border bg-background p-6 shadow-lg rounded-lg my-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <DialogPrimitive.Title className="text-lg font-semibold">
                    Configuration {schedule ? `– ${schedule.name}` : ''}
                  </DialogPrimitive.Title>
                  <p className="text-xs text-muted-foreground">Horaires, jours ouvrables, jours fériés, temps moyen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {availabilityBadge}
                <DialogPrimitive.Close className="rounded-sm opacity-70 hover:opacity-100">
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>
            </div>
            <DialogPrimitive.Description className="sr-only">
              Configuration des horaires et exceptions du service
            </DialogPrimitive.Description>

            {loading || !schedule ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Section: Horaires + Temps moyen */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Horaires & temps moyen
                  </h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">Heure d'ouverture</label>
                      <input type="time" value={openingTime}
                        onChange={e => setOpeningTime(e.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Heure de fermeture</label>
                      <input type="time" value={closingTime}
                        onChange={e => setClosingTime(e.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" /> Temps moyen (min)
                      </label>
                      <input type="number" min={1} max={240} value={avgMinutes}
                        onChange={e => setAvgMinutes(Number(e.target.value))}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                    </div>
                  </div>
                </section>

                {/* Section: Jours ouvrables */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Jours ouvrables
                  </h3>
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {workingDays.map((wd, idx) => (
                      <div key={wd.day_of_week} className="grid grid-cols-12 gap-3 items-center p-3 text-sm">
                        <div className="col-span-3 font-medium">{DAY_LABELS[wd.day_of_week]}</div>
                        <div className="col-span-2">
                          <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={wd.is_open}
                              onChange={e => {
                                const copy = [...workingDays]; copy[idx] = { ...wd, is_open: e.target.checked }; setWorkingDays(copy)
                              }} />
                            <span>{wd.is_open ? 'Ouvert' : 'Fermé'}</span>
                          </label>
                        </div>
                        <div className="col-span-3">
                          <input type="time" disabled={!wd.is_open}
                            placeholder={openingTime || '08:00'}
                            value={toHHMM(wd.opening_time)}
                            onChange={e => {
                              const copy = [...workingDays]; copy[idx] = { ...wd, opening_time: e.target.value || null }; setWorkingDays(copy)
                            }}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50" />
                        </div>
                        <div className="col-span-3">
                          <input type="time" disabled={!wd.is_open}
                            placeholder={closingTime || '18:00'}
                            value={toHHMM(wd.closing_time)}
                            onChange={e => {
                              const copy = [...workingDays]; copy[idx] = { ...wd, closing_time: e.target.value || null }; setWorkingDays(copy)
                            }}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50" />
                        </div>
                        <div className="col-span-1 text-xs text-muted-foreground text-right">
                          (override)
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Laissez les heures vides pour utiliser les horaires par défaut du service.
                  </p>
                </section>

                <div className="flex justify-end">
                  <button
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50"
                    onClick={saveScheduleBulk}
                  >
                    {saving ? 'Enregistrement…' : 'Enregistrer horaires & jours'}
                  </button>
                </div>

                {/* Section: Exceptions / jours fériés */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Jours fériés & exceptions
                  </h3>

                  <div className="rounded-lg border border-border overflow-hidden">
                    {schedule.exceptions.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">Aucune exception configurée.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">Libellé</th>
                            <th className="px-3 py-2 text-left">Plage</th>
                            <th className="px-3 py-2 text-left">Récurrent</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {schedule.exceptions.map(ex => (
                            <tr key={ex.id}>
                              <td className="px-3 py-2">{ex.date}</td>
                              <td className="px-3 py-2 capitalize">{ex.type}</td>
                              <td className="px-3 py-2">{ex.label ?? '—'}</td>
                              <td className="px-3 py-2">
                                {ex.is_closed
                                  ? <span className="text-red-600">Fermé toute la journée</span>
                                  : `${toHHMM(ex.starts_at)} → ${toHHMM(ex.ends_at)}`}
                              </td>
                              <td className="px-3 py-2">{ex.recurring_yearly ? 'Oui (annuel)' : '—'}</td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  onClick={() => ex.id && deleteException(ex.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Add exception */}
                  <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
                    <p className="text-sm font-medium">Ajouter une exception</p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Date</label>
                        <input type="date" value={newException.date}
                          onChange={e => setNewException({ ...newException, date: e.target.value })}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Type</label>
                        <select value={newException.type}
                          onChange={e => setNewException({ ...newException, type: e.target.value as ExceptionRow['type'], is_closed: e.target.value !== 'unavailable' })}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                          <option value="holiday">Jour férié</option>
                          <option value="closure">Fermeture exceptionnelle</option>
                          <option value="unavailable">Indisponibilité temporaire</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground">Libellé (optionnel)</label>
                        <input type="text" placeholder="ex: Fête nationale" value={newException.label ?? ''}
                          onChange={e => setNewException({ ...newException, label: e.target.value })}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                      </div>
                      {newException.type === 'unavailable' && (
                        <>
                          <div>
                            <label className="text-xs text-muted-foreground">Début</label>
                            <input type="time" value={newException.starts_at ?? ''}
                              onChange={e => setNewException({ ...newException, starts_at: e.target.value, is_closed: false })}
                              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Fin</label>
                            <input type="time" value={newException.ends_at ?? ''}
                              onChange={e => setNewException({ ...newException, ends_at: e.target.value, is_closed: false })}
                              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                          </div>
                        </>
                      )}
                      <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
                        <input type="checkbox" checked={newException.recurring_yearly}
                          onChange={e => setNewException({ ...newException, recurring_yearly: e.target.checked })} />
                        <span>Récurrent chaque année</span>
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
                        onClick={addException}
                      >
                        <Plus className="h-4 w-4" /> Ajouter
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
