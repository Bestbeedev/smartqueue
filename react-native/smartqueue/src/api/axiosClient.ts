import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
const DEBUG_MODE = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

// Types pour les tokens
interface TokenResponse {
  token: string;
  user: any;
}

interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// Création du client Axios
const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Version': '1.0.0',
  },
});

// Interceptor pour ajouter le token JWT à chaque requête
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      let token = await AsyncStorage.getItem('access_token');
      if (!token) {
        const persistedAuth = await AsyncStorage.getItem('auth-storage');
        if (persistedAuth) {
          try {
            const parsed = JSON.parse(persistedAuth);
            const storedToken = parsed?.state?.token;
            if (typeof storedToken === 'string' && storedToken.length > 0) {
              token = storedToken;
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (DEBUG_MODE) {
        const method = (config.method || 'GET').toUpperCase();
        const baseURL = config.baseURL || '';
        const url = config.url || '';
        const hasAuth = !!(config.headers as any)?.Authorization;
        console.log('[axios]', method, baseURL + url, 'auth=', hasAuth);
      }
    } catch (error) {
      console.warn('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les erreurs 401
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (DEBUG_MODE) {
      const method = (response.config.method || 'GET').toUpperCase();
      const baseURL = response.config.baseURL || '';
      const url = response.config.url || '';
      console.log('[axios]', method, baseURL + url, '->', response.status);
    }
    return response;
  },
  async (error) => {
    if (DEBUG_MODE) {
      const method = (error.config?.method || 'GET').toUpperCase();
      const baseURL = error.config?.baseURL || '';
      const url = error.config?.url || '';
      const status = error.response?.status;
      console.log('[axios]', method, baseURL + url, '->', status || 'NO_STATUS');
    }
    // Si l'erreur est 401 (Non autorisé)
    if (error.response?.status === 401) {
      const hadAuthHeader = !!(error.config?.headers as any)?.Authorization;
      if (hadAuthHeader) {
        // On vide les tokens car ils sont probablement expirés ou invalides
        await clearTokens();
      }
      
      // On peut ajouter ici une logique de redirection via un event emitter ou un store
      // Pour l'instant on laisse l'erreur remonter pour que les écrans la gèrent
    }

    return Promise.reject(error);
  }
);

// Fonctions utilitaires pour la gestion des tokens
export const saveTokens = async (tokenData: { token: string, user: any }) => {
  try {
    await AsyncStorage.setItem('access_token', tokenData.token);
    await AsyncStorage.setItem('user', JSON.stringify(tokenData.user));
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('auth-storage');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const getUser = async (): Promise<any | null> => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export default axiosClient;
