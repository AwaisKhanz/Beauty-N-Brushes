/**
 * Geocoding Service
 * Converts addresses to coordinates (latitude, longitude)
 * Supports multiple providers: Nominatim (OpenStreetMap), Google Maps, Mapbox
 */

import axios from 'axios';
import { AppError } from '../middleware/errorHandler';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  confidence?: number;
}

export interface GeocodingOptions {
  provider?: 'nominatim' | 'google' | 'mapbox';
  apiKey?: string;
}

class GeocodingService {
  private defaultProvider: 'nominatim' | 'google' | 'mapbox' = 'nominatim';
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  /**
   * Geocode an address string to coordinates
   */
  async geocodeAddress(
    address: string,
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult | null> {
    const provider = options.provider || this.defaultProvider;

    switch (provider) {
      case 'nominatim':
        return this.geocodeWithNominatim(address);
      case 'google':
        if (!options.apiKey) {
          throw new AppError(500, 'Google Maps API key required');
        }
        return this.geocodeWithGoogle(address, options.apiKey);
      case 'mapbox':
        if (!options.apiKey) {
          throw new AppError(500, 'Mapbox API key required');
        }
        return this.geocodeWithMapbox(address, options.apiKey);
      default:
        return this.geocodeWithNominatim(address);
    }
  }

  /**
   * Geocode address components to coordinates
   */
  async geocodeAddressComponents(
    components: {
      addressLine1?: string;
      addressLine2?: string;
      city: string;
      state: string;
      zipCode?: string;
      country: string;
    },
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult | null> {
    // Build address string from components
    const addressParts: string[] = [];

    if (components.addressLine1) {
      addressParts.push(components.addressLine1);
    }
    if (components.addressLine2) {
      addressParts.push(components.addressLine2);
    }
    if (components.city) {
      addressParts.push(components.city);
    }
    if (components.state) {
      addressParts.push(components.state);
    }
    if (components.zipCode) {
      addressParts.push(components.zipCode);
    }
    if (components.country) {
      addressParts.push(components.country);
    }

    const addressString = addressParts.join(', ');

    return this.geocodeAddress(addressString, options);
  }

  /**
   * Geocode using OpenStreetMap Nominatim (free, no API key required)
   */
  private async geocodeWithNominatim(address: string): Promise<GeocodingResult | null> {
    try {
      const response = await axios.get(`${this.nominatimBaseUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'BeautyNBrushes/1.0', // Required by Nominatim
        },
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const result = response.data[0];

      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
        confidence: result.importance || 0,
      };
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      // Don't throw error, just return null - geocoding is optional
      return null;
    }
  }

  /**
   * Geocode using Google Maps Geocoding API
   */
  private async geocodeWithGoogle(
    address: string,
    apiKey: string
  ): Promise<GeocodingResult | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: apiKey,
        },
        timeout: 10000,
      });

      if (
        !response.data ||
        response.data.status !== 'OK' ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        return null;
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        confidence: result.geometry.location_type === 'ROOFTOP' ? 1.0 : 0.8,
      };
    } catch (error) {
      console.error('Google Maps geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode using Mapbox Geocoding API
   */
  private async geocodeWithMapbox(
    address: string,
    accessToken: string
  ): Promise<GeocodingResult | null> {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: accessToken,
            limit: 1,
          },
          timeout: 10000,
        }
      );

      if (
        !response.data ||
        !response.data.features ||
        response.data.features.length === 0
      ) {
        return null;
      }

      const feature = response.data.features[0];
      const [longitude, latitude] = feature.center;

      return {
        latitude,
        longitude,
        formattedAddress: feature.place_name,
        confidence: feature.relevance || 0,
      };
    } catch (error) {
      console.error('Mapbox geocoding error:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();

