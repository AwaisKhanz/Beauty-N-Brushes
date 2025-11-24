/**
 * Saved Search Types
 * Types for saving and managing search queries
 */

// ================================
// Saved Search Types
// ================================

export interface SavedSearch {
  id: string;
  clientId: string;
  searchName: string | null;
  categoryId: string | null;
  locationCity: string | null;
  locationState: string | null;
  maxDistanceMiles: number | null;
  priceMin: number | null;
  priceMax: number | null;
  notifyNewMatches: boolean;
  createdAt: string;
}

// ================================
// Request Types
// ================================

export interface CreateSavedSearchRequest {
  searchName?: string;
  categoryId?: string;
  locationCity?: string;
  locationState?: string;
  maxDistanceMiles?: number;
  priceMin?: number;
  priceMax?: number;
  notifyNewMatches?: boolean;
}

export interface UpdateSavedSearchRequest {
  searchName?: string;
  notifyNewMatches?: boolean;
}

// ================================
// Response Types
// ================================

export interface CreateSavedSearchResponse {
  message: string;
  savedSearch: SavedSearch;
}

export interface GetSavedSearchesResponse {
  message: string;
  savedSearches: SavedSearch[];
  total: number;
}

export interface GetSavedSearchResponse {
  message: string;
  savedSearch: SavedSearch;
}

export interface UpdateSavedSearchResponse {
  message: string;
  savedSearch: SavedSearch;
}

export interface DeleteSavedSearchResponse {
  message: string;
}
