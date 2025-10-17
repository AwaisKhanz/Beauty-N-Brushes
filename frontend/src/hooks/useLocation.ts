'use client';

import { useState, useEffect } from 'react';
import type { LocationData } from '@/components/shared/LocationAutocomplete';

interface UseLocationOptions {
  enableGeolocation?: boolean;
  defaultLocation?: Partial<LocationData>;
}

interface UseLocationReturn {
  currentLocation: LocationData | null;
  isLoading: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<void>;
  searchLocation: (query: string) => Promise<LocationData[]>;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    options.defaultLocation
      ? {
          address: options.defaultLocation.address || '',
          city: options.defaultLocation.city || '',
          state: options.defaultLocation.state || '',
          zipCode: options.defaultLocation.zipCode || '',
          country: options.defaultLocation.country || '',
          latitude: options.defaultLocation.latitude,
          longitude: options.defaultLocation.longitude,
        }
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
          `format=json&` +
          `lat=${latitude}&` +
          `lon=${longitude}&` +
          `addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address;

        // Smart address parsing using display_name as fallback
        const displayParts = data.display_name.split(',').map((part: string) => part.trim());

        // Build street address (try multiple address components)
        const streetParts = [];
        if (address.house_number) streetParts.push(address.house_number);
        if (address.road) streetParts.push(address.road);
        if (address.house_name) streetParts.push(address.house_name);
        if (address.suburb) streetParts.push(address.suburb);
        if (address.neighbourhood) streetParts.push(address.neighbourhood);
        const streetAddress = streetParts.join(' ');

        // Smart city detection
        let city =
          address.city ||
          address.town ||
          address.village ||
          address.subdistrict ||
          address.municipality ||
          address.district ||
          address.hamlet ||
          address.locality ||
          '';

        if (!city && displayParts.length > 1) {
          city = displayParts[0] || displayParts[1] || '';
        }

        // Smart state detection
        let state =
          address.state ||
          address.province ||
          address.region ||
          address.administrative ||
          address.county ||
          '';

        if (!state && displayParts.length > 2) {
          state = displayParts[1] || displayParts[2] || '';
        }

        const location: LocationData = {
          address: streetAddress || city || displayParts[0] || '',
          city: city || displayParts[0] || '',
          state: state,
          zipCode: address.postcode || address.postal_code || '',
          country:
            address.country ||
            (displayParts.length > 0 ? displayParts[displayParts.length - 1] : '') ||
            '',
          latitude,
          longitude,
        };

        setCurrentLocation(location);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocation = async (query: string): Promise<LocationData[]> => {
    if (query.length < 3) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(query)}&` +
          `limit=15&` +
          `addressdetails=1&` +
          `extratags=1`
      );

      if (response.ok) {
        const results = await response.json();
        return results.map((result: any) => {
          // Smart address parsing using display_name as fallback
          const displayParts = result.display_name.split(',').map((part: string) => part.trim());

          // Build street address (try multiple address components)
          const streetParts = [];
          if (result.address.house_number) streetParts.push(result.address.house_number);
          if (result.address.road) streetParts.push(result.address.road);
          if (result.address.house_name) streetParts.push(result.address.house_name);
          if (result.address.suburb) streetParts.push(result.address.suburb);
          if (result.address.neighbourhood) streetParts.push(result.address.neighbourhood);
          const streetAddress = streetParts.join(' ');

          // Smart city detection
          let city =
            result.address.city ||
            result.address.town ||
            result.address.village ||
            result.address.subdistrict ||
            result.address.municipality ||
            result.address.district ||
            result.address.hamlet ||
            result.address.locality ||
            '';

          if (!city && displayParts.length > 1) {
            city = displayParts[0] || displayParts[1] || '';
          }

          // Smart state detection
          let state =
            result.address.state ||
            result.address.province ||
            result.address.region ||
            result.address.administrative ||
            result.address.county ||
            '';

          if (!state && displayParts.length > 2) {
            state = displayParts[1] || displayParts[2] || '';
          }

          return {
            address: streetAddress || city || displayParts[0] || '',
            city: city || displayParts[0] || '',
            state: state,
            zipCode: result.address.postcode || result.address.postal_code || '',
            country:
              result.address.country ||
              (displayParts.length > 0 ? displayParts[displayParts.length - 1] : '') ||
              '',
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          };
        });
      }
    } catch (err) {
      console.error('Location search failed:', err);
    }

    return [];
  };

  // Auto-detect location on mount if enabled
  useEffect(() => {
    if (options.enableGeolocation && !currentLocation) {
      getCurrentPosition();
    }
  }, [options.enableGeolocation, currentLocation]);

  return {
    currentLocation,
    isLoading,
    error,
    getCurrentPosition,
    searchLocation,
  };
}

// Helper function to calculate distance between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Helper function to format distance
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}
