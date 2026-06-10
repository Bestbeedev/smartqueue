import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface OfflineState {
  /** Connectivité réseau courante (non persistée, réévaluée au montage) */
  isOnline: boolean
  /** Horodatage ISO de la dernière synchronisation réussie avec le backend */
  lastSyncAt: string | null

  setIsOnline: (online: boolean) => void
  setLastSyncAt: (iso: string) => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      isOnline: true,      // optimiste — NetInfo corrigera dès le montage
      lastSyncAt: null,

      setIsOnline: (online) => set({ isOnline: online }),
      setLastSyncAt: (iso) => set({ lastSyncAt: iso }),
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // On ne persiste que lastSyncAt ; isOnline est réévalué à chaque montage
      partialize: (state) => ({ lastSyncAt: state.lastSyncAt }),
    },
  ),
)
