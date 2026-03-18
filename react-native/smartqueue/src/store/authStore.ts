import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, LoginCredentials, RegisterData, User } from '../api/authApi';

// Types pour le store d'authentification
export interface AuthState {
  // État
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

// Store d'authentification avec Zustand
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Action de connexion
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(credentials);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return response.user;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erreur de connexion';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Action d'inscription
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register(data);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erreur d\'inscription';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Action de déconnexion
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignorer les erreurs de déconnexion côté serveur
          console.warn('Logout API error:', error);
        } finally {
          // Clear ticket store to prevent stale data from previous user
          const { useTicketStore } = require('./ticketStore');
          useTicketStore.getState().clearActiveTicket();
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },


      // Effacer les erreurs
      clearError: () => {
        set({ error: null });
      },

      // Définir l'état de chargement
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Mettre à jour les informations utilisateur
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      // Vérifier l'authentification au démarrage
      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        try {
          const user = await authApi.me();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Token invalide, déconnecter
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hooks personnalisés pour le store d'authentification
export const useAuth = () => {
  const authStore = useAuthStore();
  
  return {
    // État
    user: authStore.user,
    token: authStore.token,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    
    // Actions
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    clearError: authStore.clearError,
    setLoading: authStore.setLoading,
    updateUser: authStore.updateUser,
    checkAuth: authStore.checkAuth,
    
    // Computed properties
    isLoggedIn: authStore.isAuthenticated && authStore.token !== null,
    userName: authStore.user?.name || '',
    userEmail: authStore.user?.email || '',
    userPhone: authStore.user?.phone || '',
    memberSince: authStore.user?.created_at || '',
  };
};

export default useAuthStore;
