/**
 * Distance calculation utilities using Haversine formula
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TravelTimes {
  walking: number;    // minutes
  motorcycle: number;  // minutes
  car: number;        // minutes
}

export interface DistanceInfo {
  kilometers: number;
  meters: number;
  travelTimes: TravelTimes;
}

// Default speeds (km/h) - configurable via backend later
const DEFAULT_SPEEDS = {
  walking: 5,      // 5 km/h
  motorcycle: 30,  // 30 km/h
  car: 25,         // 25 km/h (urban)
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate travel time based on distance and speed
 * @param distanceKm distance in kilometers
 * @param speedKmh speed in km/h
 * @returns time in minutes
 */
export function calculateTravelTime(distanceKm: number, speedKmh: number): number {
  // Time = Distance / Speed, then convert hours to minutes
  return Math.round((distanceKm / speedKmh) * 60);
}

/**
 * Calculate all travel times for different transport modes
 */
export function calculateTravelTimes(
  distanceKm: number,
  speeds: typeof DEFAULT_SPEEDS = DEFAULT_SPEEDS
): TravelTimes {
  return {
    walking: calculateTravelTime(distanceKm, speeds.walking),
    motorcycle: calculateTravelTime(distanceKm, speeds.motorcycle),
    car: calculateTravelTime(distanceKm, speeds.car),
  };
}

/**
 * Get complete distance information including travel times
 */
export function getDistanceInfo(
  userLocation: Coordinates,
  establishmentLocation: Coordinates,
  speeds: typeof DEFAULT_SPEEDS = DEFAULT_SPEEDS
): DistanceInfo {
  const kilometers = calculateDistance(userLocation, establishmentLocation);
  
  return {
    kilometers,
    meters: Math.round(kilometers * 1000),
    travelTimes: calculateTravelTimes(kilometers, speeds),
  };
}

/**
 * Format distance for display
 */
export function formatDistance(kilometers: number): string {
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)} m`;
  }
  return `${kilometers.toFixed(1)} km`;
}

/**
 * Format travel time for display
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
