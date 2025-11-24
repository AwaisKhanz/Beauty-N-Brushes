/**
 * Favorite Types
 * Types for client favorites functionality
 */

export interface FavoriteProvider {
  id: string;
  providerId: string;
  businessName: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  tagline: string | null;
  averageRating: number;
  totalReviews: number;
  city: string;
  state: string;
  specializations: string[];
  servicesCount: number;
  instantBooking: boolean;
  addedAt: string;
}

export interface ToggleFavoriteRequest {
  providerId: string;
}

export interface ToggleFavoriteResponse {
  isFavorited: boolean;
  message: string;
}

export interface GetFavoritesResponse {
  favorites: FavoriteProvider[];
  total: number;
  message: string;
}
