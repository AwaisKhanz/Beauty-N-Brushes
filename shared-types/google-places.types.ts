/**
 * Google Places API Types
 * Types for Google Places API integration
 */

// ================================
// Google Places Core Types
// ================================

export interface GoogleAddressComponent {
  longName: string;
  shortName: string;
  types: string[];
}

export interface GooglePlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
  viewport?: {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
}

export interface GooglePlaceDetails {
  placeId: string;
  formattedAddress: string;
  addressComponents: GoogleAddressComponent[];
  geometry: GooglePlaceGeometry;
  name?: string;
  types?: string[];
}

export interface GoogleAutocompletePrediction {
  placeId: string;
  description: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
    mainTextMatchedSubstrings?: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
}

// ================================
// Location Data with Google Places
// ================================

export interface LocationData {
  // Google Places fields
  placeId?: string;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  
  // Standard address fields
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Coordinates
  latitude?: number;
  longitude?: number;
}

// ================================
// Helper Functions Types
// ================================

export interface ParsedAddressComponents {
  streetNumber?: string;
  route?: string;
  city?: string;
  state?: string;
  stateShort?: string;
  zipCode?: string;
  country?: string;
  countryShort?: string;
}

export interface GooglePlacesConfig {
  apiKey: string;
  sessionToken?: string;
  language?: string;
  region?: string;
}
