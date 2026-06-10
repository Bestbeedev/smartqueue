/**
 * useNetworkMonitor — surveillance globale de la connectivité réseau.
 *
 * Comportements :
 *  - Détecte les transitions online/offline via NetInfo.
 *  - Lors d'une reconnexion : déclenche une resync automatique du ticket actif.
 *  - Lorsque l'app repasse au premier plan (AppState → 'active') : vérifie la
 *    connexion et resync si l'utilisateur est connecté.
 *  - Met à jour `offlineStore.isOnline` et `offlineStore.lastSyncAt`.
 *
 * À monter une seule fois dans le tab layout.
 */
import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { useOfflineStore } from '../store/offlineStore'
import { useTicketStore } from '../store/ticketStore'
import { useAuthStore } from '../store/authStore'

const isReachable = (state: NetInfoState): boolean =>
  !!(state.isConnected && state.isInternetReachable !== false)

export const useNetworkMonitor = () => {
  const wasOnlineRef = useRef<boolean>(true)
  const resyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lecture directe du store (hors rendu) pour éviter les re-renders
  const setIsOnline = useOfflineStore.getState().setIsOnline
  const setLastSyncAt = useOfflineStore.getState().setLastSyncAt

  const resync = () => {
    if (resyncTimerRef.current) clearTimeout(resyncTimerRef.current)
    resyncTimerRef.current = setTimeout(async () => {
      if (!useAuthStore.getState().isAuthenticated) return
      try {
        await useTicketStore.getState().fetchActiveTicket()
        setLastSyncAt(new Date().toISOString())
      } catch {
        // silencieux — la connexion peut encore être instable
      }
    }, 1200)
  }

  useEffect(() => {
    // ── Vérification initiale ─────────────────────────────────────────────────
    NetInfo.fetch().then((state) => {
      const online = isReachable(state)
      setIsOnline(online)
      wasOnlineRef.current = online
    })

    // ── Surveillance continue ─────────────────────────────────────────────────
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = isReachable(state)
      setIsOnline(online)

      if (online && !wasOnlineRef.current) {
        // Transition offline → online : resynchronisation
        resync()
      }
      wasOnlineRef.current = online
    })

    // ── Retour au premier plan ────────────────────────────────────────────────
    const appStateSub = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') {
        NetInfo.fetch().then((state) => {
          const online = isReachable(state)
          setIsOnline(online)
          wasOnlineRef.current = online
          if (online) resync()
        })
      }
    })

    return () => {
      unsubscribe()
      appStateSub.remove()
      if (resyncTimerRef.current) clearTimeout(resyncTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
