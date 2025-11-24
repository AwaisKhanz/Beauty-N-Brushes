/**
 * Location Types
 * Types for provider multiple locations management
 */

// ================================
// Location Management
// ================================

export interface CreateLocationRequest {
  name?: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  businessPhone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary?: boolean;
}

export interface UpdateLocationManagementRequest {
  name?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  businessPhone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface ProviderLocation {
  id: string;
  providerId: string;
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  businessPhone: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationResponse {
  message: string;
  location: ProviderLocation;
}

export interface UpdateLocationManagementResponse {
  message: string;
  location: ProviderLocation;
}

export interface GetLocationResponse {
  message: string;
  location: ProviderLocation;
}

export interface GetLocationsResponse {
  message: string;
  locations: ProviderLocation[];
}

export interface DeleteLocationResponse {
  message: string;
}

