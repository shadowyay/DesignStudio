// Backend location utility functions

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

/**
 * Validate location data
 */
export const validateLocation = (location: any): boolean => {
  if (!location || typeof location !== 'object') {
    return false;
  }

  const { address, lat, lng } = location;

  // Check if required fields exist
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return false;
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  // Validate coordinate ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }

  return true;
};

/**
 * Format location data for database storage
 */
export const formatLocationForDB = (location: LocationData): LocationData => {
  return {
    address: location.address.trim(),
    lat: Number(location.lat),
    lng: Number(location.lng)
  };
};

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if two locations are within a certain distance
 */
export const isWithinDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number, 
  maxDistanceKm: number
): boolean => {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= maxDistanceKm;
}; 