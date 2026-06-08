/**
 * ServiceSoundModal
 * Admin UI to configure per-service audio alert settings:
 *  - enable / disable sound alerts
 *  - custom sound file upload (MP3 / WAV / OGG, ≤ 2 MB)
 *  - repeat interval (10–300 s)
 *  - volume (0–100 %)
 *  - in-browser preview of the current sound
 *
 * API endpoints (all admin-auth required):
 *  GET    /api/admin/services/{id}/sound
 *  PUT    /api/admin/services/{id}/sound
 *  POST   /api/admin/services/{id}/sound/upload   (multipart)
 *  DELETE /api/admin/services/{id}/sound           (reset to default)
 */
import { useEffect, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  X,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Upload,
  Trash2,
  Play,
  Loader2,
  Music,
} from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from 'sonner'

type SoundSettings = {
  enabled: boolean
  sound_uri: string | null
  repeat_interval_seconds: number
  volume: number
  push_channel_id: string
}

const DEFAULTS: SoundSettings = {
  enabled: true,
  sound_uri: null,
  repeat_interval_seconds: 30,
  volume: 1.0,
  push_channel_id: 'smartqueue-calls',
}

type Props = {
  open: boolean
  onClose: () => void
  serviceId: number | null
  serviceName?: string
}

export default function ServiceSoundModal({ open, onClose, serviceId, serviceName }: Props) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !serviceId) return
    setLoading(true)
    api
      .get(`/api/admin/services/${serviceId}/sound`)
      .then(({ data }) => {
        setSettings({ ...DEFAULTS, ...(data.data ?? {}) })
      })
      .catch(() => toast.error('Impossible de charger la configuration sonore'))
      .finally(() => setLoading(false))
  }, [open, serviceId])

  // Stop audio when modal closes
  useEffect(() => {
    if (!open) {
      audioRef.current?.pause()
      setPreviewing(false)
    }
  }, [open])

  // ── Save settings ──────────────────────────────────────────────────────────
  const save = async () => {
    if (!serviceId) return
    setSaving(true)
    try {
      const { data } = await api.put(`/api/admin/services/${serviceId}/sound`, {
        enabled: settings.enabled,
        repeat_interval_seconds: settings.repeat_interval_seconds,
        volume: settings.volume,
      })
      setSettings({ ...DEFAULTS, ...(data.data ?? {}) })
      toast.success('Configuration sonore enregistrée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // ── Upload custom sound ────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !serviceId) return

    const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      toast.error('Format non supporté. Utilisez MP3, WAV ou OGG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 2 MB)')
      return
    }

    const form = new FormData()
    form.append('sound', file)

    setUploading(true)
    setUploadProgress(0)
    try {
      const { data } = await api.post(
        `/api/admin/services/${serviceId}/sound/upload`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
          },
        },
      )
      setSettings({ ...DEFAULTS, ...(data.data ?? {}) })
      toast.success('Son personnalisé uploadé')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(msg || "Erreur lors de l'upload")
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Delete custom sound ────────────────────────────────────────────────────
  const deleteSound = async () => {
    if (!serviceId || !settings.sound_uri) return
    if (!confirm('Supprimer le son personnalisé et revenir au son par défaut ?')) return
    setDeleting(true)
    try {
      const { data } = await api.delete(`/api/admin/services/${serviceId}/sound`)
      setSettings({ ...DEFAULTS, ...(data.data ?? {}) })
      toast.success('Son personnalisé supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  const previewSound = () => {
    if (!settings.sound_uri) {
      toast("Aucun son personnalisé. Le son par défaut est défini dans l'application mobile.")
      return
    }
    const audio = audioRef.current
    if (!audio) return
    if (previewing) {
      audio.pause()
      audio.currentTime = 0
      setPreviewing(false)
      return
    }
    audio.volume = settings.volume
    audio.play()
      .then(() => setPreviewing(true))
      .catch(() => toast.error('Impossible de lire le fichier audio'))
  }

  const handleAudioEnded = () => setPreviewing(false)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const volumePercent = Math.round(settings.volume * 100)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                  Alertes sonores
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-muted-foreground">
                  {serviceName ?? 'Configuration du son d\'appel'}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 px-6 py-5">

              {/* ── Enable toggle ── */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  {settings.enabled
                    ? <Bell className="h-4 w-4 text-amber-500" />
                    : <BellOff className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Alertes sonores</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.enabled
                        ? 'Son joué à chaque appel de ticket'
                        : 'Aucune alerte sonore'}
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  role="switch"
                  aria-checked={settings.enabled}
                  onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${settings.enabled ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Settings (only shown when enabled) */}
              {settings.enabled && (
                <>
                  {/* ── Volume ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {volumePercent === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        Volume
                      </label>
                      <span className="text-sm font-semibold tabular-nums text-foreground w-10 text-right">
                        {volumePercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={volumePercent}
                      onChange={(e) => setSettings(s => ({ ...s, volume: Number(e.target.value) / 100 }))}
                      className="w-full h-2 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* ── Repeat interval ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Intervalle de répétition
                      </label>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {settings.repeat_interval_seconds} s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={300}
                      step={10}
                      value={settings.repeat_interval_seconds}
                      onChange={(e) =>
                        setSettings(s => ({ ...s, repeat_interval_seconds: Number(e.target.value) }))
                      }
                      className="w-full h-2 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 s</span>
                      <span>5 min</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le son est rejoué toutes les {settings.repeat_interval_seconds} secondes
                      tant que l'usager n'a pas répondu.
                    </p>
                  </div>

                  {/* ── Custom sound file ── */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Son d'appel personnalisé</p>

                    {/* Current sound info */}
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                      <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        {settings.sound_uri ? (
                          <>
                            <p className="text-xs font-medium text-foreground truncate">
                              Son personnalisé
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {settings.sound_uri.split('/').pop()}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Son par défaut (défini dans l'application mobile)
                          </p>
                        )}
                      </div>

                      {/* Preview button */}
                      <button
                        onClick={previewSound}
                        disabled={!settings.sound_uri}
                        title={settings.sound_uri ? (previewing ? 'Arrêter' : 'Prévisualiser') : 'Aucun fichier'}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      >
                        {previewing ? (
                          <span className="flex gap-0.5">
                            <span className="h-3 w-0.5 animate-[soundbar_0.8s_ease-in-out_infinite] rounded-full bg-amber-500" />
                            <span className="h-3 w-0.5 animate-[soundbar_0.8s_ease-in-out_0.2s_infinite] rounded-full bg-amber-500" />
                            <span className="h-3 w-0.5 animate-[soundbar_0.8s_ease-in-out_0.4s_infinite] rounded-full bg-amber-500" />
                          </span>
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Delete custom sound */}
                      {settings.sound_uri && (
                        <button
                          onClick={deleteSound}
                          disabled={deleting}
                          title="Supprimer le son personnalisé"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:pointer-events-none disabled:opacity-40"
                        >
                          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Upload area */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600 dark:hover:bg-amber-900/10 disabled:pointer-events-none disabled:opacity-60"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Upload… {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            {settings.sound_uri ? 'Remplacer le son' : 'Importer un son'}
                            <span className="text-xs opacity-60">MP3 · WAV · OGG · max 2 MB</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              onClick={onClose}
            >
              Fermer
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-60"
              onClick={save}
              disabled={saving || loading}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>

      {/* Hidden audio element for browser preview */}
      {settings.sound_uri && (
        <audio
          ref={audioRef}
          src={settings.sound_uri}
          onEnded={handleAudioEnded}
          preload="auto"
        />
      )}
    </DialogPrimitive.Root>
  )
}
