/**
 * Custom React Hook for Google Places API (New)
 * Provides autocomplete and place selection functionality
 */

import { useState, useCallback, useRef } from 'react';
import {
  getAutocompletePredictions,
  getPlaceDetails,
  placeDetailsToLocationData,
  reverseGeocode,
  generateSessionToken,
} from '../lib/google-places';
import type { GoogleAutocompletePrediction, LocationData } from '../../../shared-types';

interface UseGooglePlacesOptions {
  debounceMs?: number;
  locationBias?: {
    circle?: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
    rectangle?: {
      low: { latitude: number; longitude: number };
      high: { latitude: number; longitude: number };
    };
  };
  includedPrimaryTypes?: string[];
  languageCode?: string;
  regionCode?: string;
}

export function useGooglePlaces(options: UseGooglePlacesOptions = {}) {
  const {
    debounceMs = 300,
    locationBias,
    includedPrimaryTypes,
    languageCode,
    regionCode,
  } = options;

  const [predictions, setPredictions] = useState<GoogleAutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<string>(generateSessionToken());

  /**
   * Search for places based on input text
   */
  const searchPlaces = useCallback(
    async (input: string) => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Clear predictions if input is too short
      if (!input || input.length < 3) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await getAutocompletePredictions(input, {
            sessionToken: sessionTokenRef.current,
            locationBias,
            includedPrimaryTypes,
            languageCode,
            regionCode,
          });

          setPredictions(results);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch predictions';
          setError(errorMessage);
          console.error('Search places error:', err);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, locationBias, includedPrimaryTypes, languageCode, regionCode]
  );

  /**
   * Select a place and get its details
   */
  const selectPlace = useCallback(async (placeId: string): Promise<LocationData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get place details using the session token
      const details = await getPlaceDetails(placeId);

      // Convert to LocationData
      const locationData = placeDetailsToLocationData(details);

      // Reset session token after selection (billing optimization)
      sessionTokenRef.current = generateSessionToken();

      // Clear predictions
      setPredictions([]);

      return locationData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch place details';
      setError(errorMessage);
      console.error('Select place error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get current location using browser geolocation API
   * and reverse geocode to get address
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const locationData = await reverseGeocode(latitude, longitude);

      if (!locationData) {
        throw new Error('Could not find address for your location');
      }

      return locationData;
    } catch (err) {
      let errorMessage = 'Failed to get current location';

      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Get current location error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear predictions
   */
  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    predictions,
    isLoading,
    error,
    searchPlaces,
    selectPlace,
    getCurrentLocation,
    clearPredictions,
    clearError,
  };
}
