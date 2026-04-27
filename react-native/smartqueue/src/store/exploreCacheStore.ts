import { create } from 'zustand';
import { Establishment } from '../api/establishmentsApi';

interface CachedData {
  establishments: Establishment[];
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ExploreCacheState {
  cachedData: CachedData | null;
  isRefreshing: boolean;
  
  // Actions
  setCachedData: (data: Omit<CachedData, 'timestamp'>) => void;
  getCachedData: () => CachedData | null;
  shouldUseCache: (currentLocation: { latitude: number; longitude: number }) => boolean;
  clearCache: () => void;
  setRefreshing: (refreshing: boolean) => void;
  forceRefresh: () => void;
}

// Durée de validité du cache : 2 minutes (en ms)
const CACHE_DURATION = 2 * 60 * 1000;
// Distance maximale pour réutiliser le cache : 100 mètres
const MAX_DISTANCE_FOR_CACHE = 0.1; // km

export const useExploreCacheStore = create<ExploreCacheState>()((set, get) => ({
  cachedData: null,
  isRefreshing: false,

  setCachedData: (data) => {
    set({
      cachedData: {
        ...data,
        timestamp: Date.now(),
      },
    });
  },

  getCachedData: () => {
    return get().cachedData;
  },

  shouldUseCache: (currentLocation) => {
    const cached = get().cachedData;
    if (!cached) return false;

    // Vérifier si le cache n'est pas trop vieux
    const now = Date.now();
    if (now - cached.timestamp > CACHE_DURATION) return false;

    // Vérifier si l'utilisateur n'a pas bougé de plus de 100m
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      cached.location.latitude,
      cached.location.longitude
    );

    return distance <= MAX_DISTANCE_FOR_CACHE;
  },

  clearCache: () => {
    set({ cachedData: null });
  },

  setRefreshing: (refreshing) => {
    set({ isRefreshing: refreshing });
  },

  forceRefresh: () => {
    set({ cachedData: null });
  },
}));

// Fonction utilitaire pour calculer la distance (formule Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Hook personnalisé pour faciliter l'utilisation
export const useExploreCache = () => {
  const cacheStore = useExploreCacheStore();

  return {
    cachedEstablishments: cacheStore.cachedData?.establishments || null,
    lastUpdated: cacheStore.cachedData?.timestamp || null,
    isRefreshing: cacheStore.isRefreshing,
    setCachedData: cacheStore.setCachedData,
    shouldUseCache: cacheStore.shouldUseCache,
    clearCache: cacheStore.clearCache,
    setRefreshing: cacheStore.setRefreshing,
    forceRefresh: cacheStore.forceRefresh,
  };
};

export default useExploreCacheStore;
