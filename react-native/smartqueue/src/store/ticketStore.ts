import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ticketsApi, Ticket, CreateTicketData } from '../api/ticketsApi';

// Types pour le store de tickets
export interface TicketState {
  // État du ticket actif
  activeTicket: Ticket | null;
  position: number;
  etaMinutes: number;
  isAlmostThere: boolean;
  isCalled: boolean;
  
  // Rappel (seconde chance)
  hasRecalled: boolean;
  countdownExpiry: Date | null;
  counterNumber: string | null;
  
  // État de connexion WebSocket
  isConnected: boolean;
  lastUpdate: Date | null;
  
  // État de chargement
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setActiveTicket: (ticket: Ticket | null) => void;
  updatePosition: (position: number, etaMinutes: number) => void;
  markAsCalled: (counterNumber?: string) => void;
  markAsAlmostThere: () => void;
  clearActiveTicket: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createTicket: (data: CreateTicketData) => Promise<Ticket>;
  cancelTicket: (ticketId: number) => Promise<void>;
  refreshActiveTicket: () => Promise<void>;
  fetchActiveTicket: () => Promise<void>;
  updateTicketStatus: (status: Ticket['status']) => void;
  setWebSocketConnected: (connected: boolean) => void;
  setLastUpdate: (date: Date) => void;
  
  // Rappel actions
  setRecalled: () => void;
  resetRecall: () => void;
  setCountdownExpiry: (expiry: Date | null) => void;
}

// Store de tickets avec Zustand
export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      // État initial
      activeTicket: null,
      position: 0,
      etaMinutes: 0,
      isAlmostThere: false,
      isCalled: false,
      hasRecalled: false,
      countdownExpiry: null,
      counterNumber: null,
      isConnected: false,
      lastUpdate: null,
      isLoading: false,
      error: null,

      // Définir le ticket actif
      setActiveTicket: (ticket: Ticket | null) => {
        set({
          activeTicket: ticket,
          position: ticket?.position || 0,
          etaMinutes: ticket?.eta_minutes || 0,
          isAlmostThere: ticket?.position ? ticket.position <= 2 : false,
          isCalled: ticket?.status === 'called',
          error: null,
        });
      },

      // Mettre à jour la position et l'ETA
      updatePosition: (position: number, etaMinutes: number) => {
        const { isCalled } = get();
        
        set({
          position,
          etaMinutes,
          isAlmostThere: !isCalled && position <= 2,
          lastUpdate: new Date(),
        });
      },

      // Marquer comme appelé
      markAsCalled: (counterNumber?: string) => {
        // Set countdown expiry to 3 minutes from now
        const expiry = new Date(Date.now() + 3 * 60 * 1000);
        set({
          isCalled: true,
          isAlmostThere: false,
          counterNumber: counterNumber || null,
          countdownExpiry: expiry,
          lastUpdate: new Date(),
        });
      },

      // Marquer comme "presque ton tour"
      markAsAlmostThere: () => {
        set({
          isAlmostThere: true,
          lastUpdate: new Date(),
        });
      },

      // Effacer le ticket actif
      clearActiveTicket: () => {
        set({
          activeTicket: null,
          position: 0,
          etaMinutes: 0,
          isAlmostThere: false,
          isCalled: false,
          hasRecalled: false,
          countdownExpiry: null,
          counterNumber: null,
          lastUpdate: new Date(),
        });
      },

      // Définir l'état de chargement
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Définir l'erreur
      setError: (error: string | null) => {
        set({ error });
      },

      // Créer un nouveau ticket
      createTicket: async (data: CreateTicketData) => {
        set({ isLoading: true, error: null });

        try {
          const ticket = await ticketsApi.createTicket(data);
          
          // Handle API response that may be wrapped in {data: {...}}
          const ticketData = (ticket as any)?.data || ticket;
          
          set({
            activeTicket: ticketData,
            position: ticketData.position || 0,
            etaMinutes: ticketData.eta_minutes || 0,
            isAlmostThere: ticketData.position ? ticketData.position <= 2 : false,
            isCalled: ticketData.status === 'called',
            isLoading: false,
            error: null,
            lastUpdate: new Date(),
          });

          return ticketData;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erreur lors de la création du ticket';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Annuler un ticket
      cancelTicket: async (ticketId: number) => {
        set({ isLoading: true, error: null });

        try {
          await ticketsApi.cancelTicket(ticketId);
          
          // Effacer le ticket actif si c'est celui qu'on annule
          const { activeTicket } = get();
          if (activeTicket?.id === ticketId) {
            set({
              activeTicket: null,
              position: 0,
              etaMinutes: 0,
              isAlmostThere: false,
              isCalled: false,
              lastUpdate: new Date(),
            });
          }

          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erreur lors de l\'annulation du ticket';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Rafraîchir le ticket actif
      refreshActiveTicket: async () => {
        const { activeTicket } = get();
        
        if (!activeTicket) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const updatedTicket = await ticketsApi.getTicket(activeTicket.id);
          
          set({
            activeTicket: updatedTicket,
            position: updatedTicket.position,
            etaMinutes: updatedTicket.eta_minutes,
            isAlmostThere: updatedTicket.position <= 2,
            isCalled: updatedTicket.status === 'called',
            isLoading: false,
            error: null,
            lastUpdate: new Date(),
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erreur lors du rafraîchissement du ticket';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Récupérer le ticket actif depuis le backend (pas seulement rafraîchir)
      fetchActiveTicket: async () => {
        set({ isLoading: true, error: null });

        try {
          const ticket = await ticketsApi.getMyActiveTicket();
          
          if (ticket) {
            set({
              activeTicket: ticket,
              position: ticket.position || 0,
              etaMinutes: ticket.eta_minutes || 0,
              isAlmostThere: ticket.position ? ticket.position <= 2 : false,
              isCalled: ticket.status === 'called',
              isLoading: false,
              error: null,
              lastUpdate: new Date(),
            });
          } else {
            // Pas de ticket actif
            set({
              activeTicket: null,
              position: 0,
              etaMinutes: 0,
              isAlmostThere: false,
              isCalled: false,
              isLoading: false,
              error: null,
              lastUpdate: new Date(),
            });
          }
        } catch (error: any) {
          // 404 = pas de ticket actif, ce n'est pas une erreur
          if (error.response?.status === 404) {
            set({
              activeTicket: null,
              position: 0,
              etaMinutes: 0,
              isAlmostThere: false,
              isCalled: false,
              isLoading: false,
              error: null,
              lastUpdate: new Date(),
            });
            return;
          }
          const errorMessage = error.response?.data?.message || 'Erreur lors de la récupération du ticket';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Mettre à jour le statut du ticket
      updateTicketStatus: (status: Ticket['status']) => {
        const { activeTicket } = get();
        
        if (activeTicket) {
          const updatedTicket = { ...activeTicket, status };
          
          set({
            activeTicket: updatedTicket,
            isCalled: status === 'called',
            lastUpdate: new Date(),
          });
        }
      },

      setWebSocketConnected: (connected: boolean) => {
        set({ isConnected: connected });
      },

      setLastUpdate: (date: Date) => {
        set({ lastUpdate: date });
      },

      // Rappel actions
      setRecalled: () => {
        // Reset countdown to another 3 minutes
        const expiry = new Date(Date.now() + 3 * 60 * 1000);
        set({
          hasRecalled: true,
          countdownExpiry: expiry,
        });
      },

      resetRecall: () => {
        set({
          hasRecalled: false,
          countdownExpiry: null,
        });
      },

      setCountdownExpiry: (expiry: Date | null) => {
        set({ countdownExpiry: expiry });
      },
    }),
    {
      name: 'ticket-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeTicket: state.activeTicket,
        position: state.position,
        etaMinutes: state.etaMinutes,
        isAlmostThere: state.isAlmostThere,
        isCalled: state.isCalled,
        hasRecalled: state.hasRecalled,
      }),
    }
  )
);

// Hooks personnalisés pour le store de tickets
export const useTicket = () => {
  const ticketStore = useTicketStore();
  
  return {
    // État
    activeTicket: ticketStore.activeTicket,
    position: ticketStore.position,
    etaMinutes: ticketStore.etaMinutes,
    isAlmostThere: ticketStore.isAlmostThere,
    isCalled: ticketStore.isCalled,
    hasRecalled: ticketStore.hasRecalled,
    countdownExpiry: ticketStore.countdownExpiry,
    counterNumber: ticketStore.counterNumber,
    isConnected: ticketStore.isConnected,
    lastUpdate: ticketStore.lastUpdate,
    isLoading: ticketStore.isLoading,
    error: ticketStore.error,
    
    // Actions
    setActiveTicket: ticketStore.setActiveTicket,
    updatePosition: ticketStore.updatePosition,
    markAsCalled: ticketStore.markAsCalled,
    markAsAlmostThere: ticketStore.markAsAlmostThere,
    clearActiveTicket: ticketStore.clearActiveTicket,
    setLoading: ticketStore.setLoading,
    setError: ticketStore.setError,
    createTicket: ticketStore.createTicket,
    cancelTicket: ticketStore.cancelTicket,
    refreshActiveTicket: ticketStore.refreshActiveTicket,
    fetchActiveTicket: ticketStore.fetchActiveTicket,
    updateTicketStatus: ticketStore.updateTicketStatus,
    setWebSocketConnected: ticketStore.setWebSocketConnected,
    setLastUpdate: ticketStore.setLastUpdate,
    setRecalled: ticketStore.setRecalled,
    resetRecall: ticketStore.resetRecall,
    setCountdownExpiry: ticketStore.setCountdownExpiry,
    
    // Computed properties
    hasActiveTicket: ticketStore.activeTicket !== null,
    ticketNumber: ticketStore.activeTicket?.number || '',
    serviceName: ticketStore.activeTicket?.service?.name || '',
    establishmentName: ticketStore.activeTicket?.establishment?.name || '',
    ticketStatus: ticketStore.activeTicket?.status || 'created',
    peopleAhead: Math.max(0, ticketStore.position - 1),
    progressPercentage: ticketStore.position > 0 ? Math.max(0, (1 - ticketStore.position / 10) * 100) : 100,
    timeAgo: ticketStore.lastUpdate 
      ? Math.floor((Date.now() - ticketStore.lastUpdate.getTime()) / 1000 / 60) 
      : 0,
  };
};

export default useTicketStore;
