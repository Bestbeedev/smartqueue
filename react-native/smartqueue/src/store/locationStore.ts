import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  
  setLocation: (location: LocationData) => void;
  clearLocation: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      isLoading: false,
      error: null,
      
      setLocation: (location) => set({ location, error: null }),
      clearLocation: () => set({ location: null, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'smartqueue-location-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
