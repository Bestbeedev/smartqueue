import { useState, useEffect, useCallback, useRef } from 'react';
import { useGeolocation, LocationData } from './useGeolocation';
import {
  Coordinates,
  DistanceInfo,
  getDistanceInfo,
  calculateDistance,
} from '../utils/distance';

interface UseDistanceTrackingOptions {
  targetCoordinates: Coordinates | null;
  autoRefreshInterval?: number; // milliseconds, default 30000 (30s)
  distanceThreshold?: number;   // meters, default 100m
  enabled?: boolean;
}

interface DistanceTrackingResult {
  distanceInfo: DistanceInfo | null;
  userLocation: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  lastUpdate: Date | null;
  refreshDistance: () => Promise<void>;
}

/**
 * Hook for real-time distance tracking with auto-refresh
 * - Updates every 30 seconds
 * - Updates immediately if position changes by more than 100m
 */
export const useDistanceTracking = (
  options: UseDistanceTrackingOptions
): DistanceTrackingResult => {
  const {
    targetCoordinates,
    autoRefreshInterval = 30000, // 30 seconds
    distanceThreshold = 100,      // 100 meters
    enabled = true,
  } = options;

  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const lastPositionRef = useRef<Coordinates | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use geolocation with position watching
  const {
    location: userLocation,
    isLoading,
    error,
    hasPermission,
    getCurrentPosition,
    startWatching,
    stopWatching,
  } = useGeolocation({
    watchPosition: enabled,
    distanceFilter: distanceThreshold, // Only update if moved by threshold
    enableHighAccuracy: true,
  });

  // Calculate distance when position or target changes
  const calculateDistanceToTarget = useCallback(
    async (userCoords: Coordinates) => {
      if (!targetCoordinates) {
        setDistanceInfo(null);
        return;
      }

      // Check if position changed significantly (100m threshold)
      if (lastPositionRef.current) {
        const distanceFromLastPosition = calculateDistance(
          lastPositionRef.current,
          userCoords
        );
        
        // If moved less than threshold and we have recent data, skip update
        if (distanceFromLastPosition * 1000 < distanceThreshold && distanceInfo) {
          return;
        }
      }

      const info = getDistanceInfo(userCoords, targetCoordinates);
      setDistanceInfo(info);
      setLastUpdate(new Date());
      lastPositionRef.current = userCoords;
    },
    [targetCoordinates, distanceThreshold, distanceInfo]
  );

  // Update distance when user location changes
  useEffect(() => {
    if (!enabled || !userLocation || !targetCoordinates) return;

    calculateDistanceToTarget({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });
  }, [userLocation, targetCoordinates, enabled, calculateDistanceToTarget]);

  // Set up 30-second auto-refresh interval
  useEffect(() => {
    if (!enabled || !targetCoordinates) return;

    refreshIntervalRef.current = setInterval(async () => {
      const position = await getCurrentPosition();
      if (position && targetCoordinates) {
        calculateDistanceToTarget({
          latitude: position.latitude,
          longitude: position.longitude,
        });
      }
    }, autoRefreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [enabled, targetCoordinates, autoRefreshInterval, getCurrentPosition, calculateDistanceToTarget]);

  // Start/stop watching position based on enabled flag
  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }
  }, [enabled, startWatching, stopWatching]);

  // Manual refresh function
  const refreshDistance = useCallback(async () => {
    const position = await getCurrentPosition();
    if (position && targetCoordinates) {
      calculateDistanceToTarget({
        latitude: position.latitude,
        longitude: position.longitude,
      });
    }
  }, [getCurrentPosition, targetCoordinates, calculateDistanceToTarget]);

  return {
    distanceInfo,
    userLocation,
    isLoading,
    error,
    hasPermission,
    lastUpdate,
    refreshDistance,
  };
};

export default useDistanceTracking;
