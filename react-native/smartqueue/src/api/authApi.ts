import axiosClient, { saveTokens, clearTokens } from './axiosClient';

// Types pour l'authentification
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceData {
  device_id: string;
  platform: string;
  token: string; // FCM token
}

// Fonctions API d'authentification
export const authApi = {
  // Connexion
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/login', credentials);
    const authData = response.data;
    
    // Sauvegarder les tokens
    await saveTokens(authData);
    
    return authData;
  },

  // Inscription
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/register', data);
    const authData = response.data;
    
    // Sauvegarder les tokens
    await saveTokens(authData);
    
    return authData;
  },

  // Déconnexion
  logout: async (): Promise<void> => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // Même si la déconnexion côté serveur échoue, on clear les tokens locaux
      console.warn('Logout API call failed:', error);
    } finally {
      await clearTokens();
    }
  },

  // Obtenir le profil utilisateur courant
  me: async (): Promise<User> => {
    const response = await axiosClient.get('/me');
    return response.data;
  },

  // Enregistrer un appareil pour les notifications push
  registerDevice: async (deviceData: DeviceData): Promise<void> => {
    await axiosClient.post('/auth/devices/register', deviceData);
  },

  // Vérifier si l'email est déjà utilisé
  checkEmail: async (email: string): Promise<{ exists: boolean }> => {
    // Note: Cet endpoint n'existe pas encore dans l'API Laravel, à implémenter si nécessaire
    const response = await axiosClient.post('/auth/check-email', { email });
    return response.data;
  },

  // Demander un reset de mot de passe
  forgotPassword: async (email: string): Promise<void> => {
    await axiosClient.post('/auth/forgot', { email });
  },

  // Réinitialiser le mot de passe
  resetPassword: async (token: string, password: string, password_confirmation: string): Promise<void> => {
    await axiosClient.post('/auth/reset', {
      token,
      password,
      password_confirmation,
    });
  },
};

export default authApi;
