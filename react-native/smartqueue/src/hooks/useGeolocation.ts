import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

// Types pour la géolocalisation
export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationPermission {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus | 'denied';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
  watchPosition?: boolean;
}

// Hook pour la gestion de la géolocalisation avec expo-location
export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permission, setPermission] = useState<LocationPermission>({
    granted: false,
    canAskAgain: true,
    status: 'denied',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  // Options par défaut
  const defaultOptions: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
    distanceFilter: 10,
    watchPosition: false,
    ...options,
  };

  // Vérifier et demander la permission de localisation
  const requestPermission = useCallback(async (): Promise<LocationPermission> => {
    try {
      setIsLoading(true);
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const newPermission: LocationPermission = {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
      
      setPermission(newPermission);
      setIsLoading(false);
      return newPermission;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setError('Erreur lors de la demande de permission');
      setIsLoading(false);
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }, []);

  const checkPermission = useCallback(async (): Promise<LocationPermission> => {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    const currentPermission: LocationPermission = {
      granted: status === Location.PermissionStatus.GRANTED,
      canAskAgain,
      status,
    };
    setPermission(currentPermission);
    return currentPermission;
  }, []);

  // Obtenir la position actuelle
  const getCurrentPosition = useCallback(async (): Promise<LocationData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Vérifier/Demander la permission
      let currentPermission = await checkPermission();
      if (!currentPermission.granted) {
        currentPermission = await requestPermission();
      }

      if (!currentPermission.granted) {
        throw new Error('Permission de localisation non accordée');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: defaultOptions.enableHighAccuracy 
          ? Location.Accuracy.Balanced 
          : Location.Accuracy.Low,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (err) {
      console.error('Error getting current position:', err);
      setError(err instanceof Error ? err.message : 'Erreur de localisation');
      setIsLoading(false);
      return null;
    }
  }, [checkPermission, requestPermission, defaultOptions.enableHighAccuracy]);

  // Surveiller la position
  const startWatching = useCallback(async () => {
    if (subscription) return;

    const currentPermission = await checkPermission();
    if (!currentPermission.granted) return;

    const newSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: defaultOptions.distanceFilter,
      },
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      }
    );

    setSubscription(newSubscription);
  }, [subscription, checkPermission, defaultOptions.distanceFilter]);

  const stopWatching = useCallback(() => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  }, [subscription]);

  // Effet initial pour charger la position et la permission
  useEffect(() => {
    checkPermission();
    getCurrentPosition();
  }, []);

  // Effet pour surveiller si activé
  useEffect(() => {
    if (defaultOptions.watchPosition) {
      startWatching();
    }
    return () => stopWatching();
  }, [defaultOptions.watchPosition, startWatching, stopWatching]);

  return {
    location,
    permission,
    isLoading,
    error,
    isWatching: !!subscription,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermission,
    hasPermission: permission.granted,
  };
};

export default useGeolocation;
