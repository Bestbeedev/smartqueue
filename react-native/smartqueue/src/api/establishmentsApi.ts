import axiosClient from './axiosClient';

// Types pour les établissements
export interface Establishment {
  id: number;
  name: string;
  address: string;
  category: string;
  lat: number;
  lng: number;
  open_at: string;
  close_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  services?: Service[];
  crowd_level?: 'low' | 'moderate' | 'high';
  avg_wait_min?: number;
  people_waiting?: number;
  open_now?: boolean;
}

export interface Service {
  id: number;
  establishment_id: number;
  name: string;
  avg_service_time_minutes: number;
  status: 'open' | 'closed';
  priority_support: boolean;
  capacity: number;
  people_waiting?: number;
  agents_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentsParams {
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
  category?: string;
  q?: string; // search query
}

export interface AffluenceData {
  crowd_level: 'low' | 'moderate' | 'high';
  active_tickets: number;
  avg_wait_min: number;
  open_now: boolean;
  peak_hours: string[];
}

export interface EstablishmentStatus {
  crowd_level: 'low' | 'moderate' | 'high';
  active_tickets: number;
  avg_wait_min: number;
  open_now: boolean;
  hours: {
    open_at: string;
    close_at: string;
  };
}

// Utility to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p) / 2 +
    c(lat1 * p) * c(lat2 * p) *
    (1 - c((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
};

// Fonctions API pour les établissements
export const establishmentsApi = {
  // Lister les établissements avec filtres et fallback intelligent
  getEstablishments: async (params: EstablishmentsParams = {}): Promise<Establishment[]> => {
    try {
      const response = await axiosClient.get('/establishments', { params });
      return response.data;
    } catch (error: any) {
      // Fallback si le backend (ex: SQLite) échoue sur les calculs trigonométriques distance (Error 500)
      if (error.response?.status === 500 && params.lat && params.lng) {
        console.warn('Backend distance calculation failed. Retrying without geo-params and sorting client-side.');
        
        // On réessaie sans les paramètres de localisation pour obtenir la liste brute
        const { lat, lng, radius, ...otherParams } = params;
        const fallbackResponse = await axiosClient.get('/establishments', { params: otherParams });
        let data = fallbackResponse.data;

        // Si la réponse est paginée, on extrait le tableau
        const establishments = Array.isArray(data) ? data : data.data || [];

        // On trie par distance côté client
        return establishments.sort((a: Establishment, b: Establishment) => {
          const distA = calculateDistance(params.lat!, params.lng!, Number(a.lat), Number(a.lng));
          const distB = calculateDistance(params.lat!, params.lng!, Number(b.lat), Number(b.lng));
          return distA - distB;
        });
      }
      throw error;
    }
  },

  // Alias pour le mobile (nearby)
  getNearbyEstablishments: async (params: EstablishmentsParams): Promise<Establishment[]> => {
    try {
      const response = await axiosClient.get('/establishments/nearby', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 500 && params.lat && params.lng) {
        return establishmentsApi.getEstablishments(params);
      }
      throw error;
    }
  },

  // Rechercher des établissements
  searchEstablishments: async (query: string): Promise<Establishment[]> => {
    const response = await axiosClient.get('/establishments/search', { params: { q: query } });
    return response.data;
  },

  // Obtenir les détails d'un établissement
  getEstablishment: async (id: number): Promise<Establishment> => {
    const response = await axiosClient.get(`/establishments/${id}`);
    return response.data;
  },

  // Obtenir les services d'un établissement
  getEstablishmentServices: async (establishmentId: number): Promise<Service[]> => {
    const response = await axiosClient.get(`/establishments/${establishmentId}/services`);
    return response.data;
  },

  // Obtenir un service spécifique
  getService: async (id: number): Promise<Service> => {
    const response = await axiosClient.get(`/services/${id}`);
    return response.data;
  },

  // Obtenir l'affluence d'un service
  getServiceAffluence: async (serviceId: number): Promise<AffluenceData> => {
    const response = await axiosClient.get(`/services/${serviceId}/affluence`);
    return response.data;
  },

  // Obtenir les recommandations pour un service
  getServiceRecommendations: async (serviceId: number): Promise<any[]> => {
    const response = await axiosClient.get(`/services/${serviceId}/recommendations`);
    return response.data;
  },

  // Obtenir le statut en temps réel d'un établissement
  getEstablishmentStatus: async (establishmentId: number): Promise<EstablishmentStatus> => {
    const response = await axiosClient.get(`/establishments/${establishmentId}/status`);
    return response.data;
  },

  // Résoudre un QR code d'établissement
  resolveQRCode: async (qrCode: string): Promise<{
    establishment: Establishment;
    services: Service[];
    current_wait: number;
    is_open: boolean;
  }> => {
    const response = await axiosClient.get(`/establishments/qr/${qrCode}`);
    return response.data;
  },

  // Obtenir les catégories disponibles
  getCategories: async (): Promise<string[]> => {
    // Note: Cet endpoint n'existe pas encore, à implémenter si nécessaire
    const response = await axiosClient.get('/establishments/categories');
    return response.data;
  },

  // Obtenir les établissements par catégorie
  getEstablishmentsByCategory: async (category: string, params: EstablishmentsParams = {}): Promise<Establishment[]> => {
    const response = await axiosClient.get('/establishments', {
      params: { ...params, category }
    });
    return response.data;
  },

  // Calculer la distance depuis un établissement
  getDistanceToEstablishment: async (establishmentId: number, userLat: number, userLng: number): Promise<{
    distance_km: number;
    estimated_time_mins: number;
  }> => {
    // Note: Cet endpoint n'existe pas encore, à implémenter si nécessaire
    const response = await axiosClient.get(`/establishments/${establishmentId}/distance`, {
      params: { lat: userLat, lng: userLng }
    });
    return response.data;
  },
};

export default establishmentsApi;
