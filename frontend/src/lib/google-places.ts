/**
 * Google Places API (New) Integration
 * REST API implementation for Autocomplete and Place Details
 * @see https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

import type {
  GooglePlaceDetails,
  GoogleAutocompletePrediction,
  GoogleAddressComponent,
  ParsedAddressComponents,
  LocationData,
} from '../../../shared-types';

const PLACES_API_BASE_URL = 'https://places.googleapis.com/v1';

/**
 * Generate a session token for billing optimization
 * Session tokens group autocomplete requests into a session
 */
export function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get autocomplete predictions using Places API (New)
 * @see https://developers.google.com/maps/documentation/places/web-service/autocomplete
 */
export async function getAutocompletePredictions(
  input: string,
  options?: {
    sessionToken?: string;
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
): Promise<GoogleAutocompletePrediction[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  if (!input || input.length < 3) {
    return [];
  }

  const requestBody: Record<string, unknown> = {
    input,
  };

  if (options?.sessionToken) {
    requestBody.sessionToken = options.sessionToken;
  }

  if (options?.locationBias) {
    requestBody.locationBias = options.locationBias;
  }

  if (options?.includedPrimaryTypes) {
    requestBody.includedPrimaryTypes = options.includedPrimaryTypes;
  }

  if (options?.languageCode) {
    requestBody.languageCode = options.languageCode;
  }

  if (options?.regionCode) {
    requestBody.regionCode = options.regionCode;
  }

  try {
    const response = await fetch(`${PLACES_API_BASE_URL}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Autocomplete failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.suggestions) {
      return [];
    }

    // Transform API response to our format
    return data.suggestions
      .filter((suggestion: { placePrediction?: unknown }) => suggestion.placePrediction)
      .map((suggestion: {
        placePrediction: {
          placeId: string;
          text: { text: string };
          structuredFormat: {
            mainText: { text: string };
            secondaryText?: { text: string };
          };
          types?: string[];
        };
      }) => ({
        placeId: suggestion.placePrediction.placeId,
        description: suggestion.placePrediction.text.text,
        structuredFormatting: {
          mainText: suggestion.placePrediction.structuredFormat.mainText.text,
          secondaryText: suggestion.placePrediction.structuredFormat.secondaryText?.text || '',
          mainTextMatchedSubstrings: [],
        },
        types: suggestion.placePrediction.types || [],
      }));
  } catch (error) {
    console.error('Autocomplete error:', error);
    throw error;
  }
}

/**
 * Get place details using Places API (New)
 * @see https://developers.google.com/maps/documentation/places/web-service/place-details
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const response = await fetch(`${PLACES_API_BASE_URL}/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'id,displayName,formattedAddress,addressComponents,location,types',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Place details failed: ${error.error?.message || response.statusText}`);
    }

    const place = await response.json();

    // Transform API response to our format
    const details: GooglePlaceDetails = {
      placeId: place.id,
      formattedAddress: place.formattedAddress || '',
      addressComponents: (place.addressComponents || []).map((component: {
        longText: string;
        shortText: string;
        types: string[];
      }) => ({
        longName: component.longText,
        shortName: component.shortText,
        types: component.types,
      })),
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      },
      name: place.displayName?.text,
      types: place.types || [],
    };

    return details;
  } catch (error) {
    console.error('Place details error:', error);
    throw error;
  }
}

/**
 * Parse address components into structured data
 */
export function parseAddressComponents(
  components: GoogleAddressComponent[]
): ParsedAddressComponents {
  const parsed: ParsedAddressComponents = {};

  components.forEach((component) => {
    if (component.types.includes('street_number')) {
      parsed.streetNumber = component.longName;
    } else if (component.types.includes('route')) {
      parsed.route = component.longName;
    } else if (component.types.includes('locality')) {
      parsed.city = component.longName;
    } else if (component.types.includes('administrative_area_level_1')) {
      parsed.state = component.longName;
      parsed.stateShort = component.shortName;
    } else if (component.types.includes('postal_code')) {
      parsed.zipCode = component.longName;
    } else if (component.types.includes('country')) {
      parsed.country = component.longName;
      parsed.countryShort = component.shortName;
    }
  });

  return parsed;
}

/**
 * Convert Google Place Details to LocationData
 */
export function placeDetailsToLocationData(details: GooglePlaceDetails): LocationData {
  const parsed = parseAddressComponents(details.addressComponents);

  // Build address line 1
  const addressLine1 =
    parsed.streetNumber && parsed.route
      ? `${parsed.streetNumber} ${parsed.route}`
      : parsed.route || '';

  return {
    placeId: details.placeId,
    formattedAddress: details.formattedAddress,
    addressComponents: details.addressComponents,
    addressLine1,
    addressLine2: '',
    city: parsed.city || '',
    state: parsed.state || parsed.stateShort || '',
    zipCode: parsed.zipCode || '',
    country: parsed.country || parsed.countryShort || 'US',
    latitude: details.geometry.location.lat,
    longitude: details.geometry.location.lng,
  };
}

/**
 * Reverse geocode coordinates to address using Geocoding API
 * @see https://developers.google.com/maps/documentation/geocoding/overview
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationData | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];

    // Transform to our GooglePlaceDetails format
    const details: GooglePlaceDetails = {
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
      addressComponents: result.address_components.map((component: {
        long_name: string;
        short_name: string;
        types: string[];
      }) => ({
        longName: component.long_name,
        shortName: component.short_name,
        types: component.types,
      })),
      geometry: {
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
      },
      types: result.types,
    };

    return placeDetailsToLocationData(details);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}
