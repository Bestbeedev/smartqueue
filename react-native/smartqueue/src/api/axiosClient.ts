import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

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
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
  (response: AxiosResponse) => response,
  async (error) => {
    // Si l'erreur est 401 (Non autorisé)
    if (error.response?.status === 401) {
      // On vide les tokens car ils sont probablement expirés ou invalides
      await clearTokens();
      
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
