import type { LocationData } from '../types';

// Location utility functions for geocoding and location handling


/**
 * Get user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          resolve({ lat: latitude, lng: longitude, address });
        } catch (_error) {
          // If reverse geocoding fails, just return coordinates
          resolve({ lat: latitude, lng: longitude, address: `${latitude}, ${longitude}` });
        }
      },
      (_error) => {
        reject(new Error('Unable to retrieve your location.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

/**
 * Format location data for display
 */
export const formatLocation = (location: LocationData): string => {
  if (location.address) {
    return location.address;
  }
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
};

/**
 * Create OpenStreetMap URL for a location
 */
export const createMapUrl = (lat: number, lng: number, zoom: number = 18): string => {
  return `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`;
};

/**
 * Validate location coordinates
 */
export const isValidLocation = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}; 