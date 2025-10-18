/**
 * Shared Inspiration Types
 * Used for AI-powered visual search and matching
 */

// ============================================
// Request Types
// ============================================

export interface UploadInspirationRequest {
  imageUrl: string;
  sourceUrl?: string;
  notes?: string;
}

export interface MatchInspirationRequest {
  inspirationId: string;
  location?: {
    city: string;
    state?: string;
    radius?: number; // in miles
  };
  maxResults?: number;
}

// ============================================
// Response Types
// ============================================

export interface InspirationImage {
  id: string;
  clientId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  aiTags: string[];
  styleDescription?: string;
  colorPalette?: {
    colors: string[];
  };
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface ImageAnalysisResult {
  hairType?: string | null;
  styleType?: string | null;
  colorInfo?: string | null;
  complexityLevel?: string;
  tags: string[];
  dominantColors?: string[];
}

export interface InspirationMatch {
  // Service Media Info
  mediaId: string;
  mediaUrl: string;
  thumbnailUrl?: string;

  // Service Info
  serviceId: string;
  serviceTitle: string;
  servicePriceMin: number;
  serviceCurrency: string;

  // Provider Info
  providerId: string;
  providerBusinessName: string;
  providerSlug: string;
  providerLogoUrl?: string;
  providerCity: string;
  providerState: string;

  // Match Info
  matchScore: number; // 0-100
  distance: number; // Vector distance (lower is better)
  matchingTags: string[]; // Tags that matched between inspiration and service
  aiTags?: string[]; // All AI tags from the matched media
}

export interface UploadInspirationResponse {
  message: string;
  inspiration: InspirationImage;
  analysis: ImageAnalysisResult;
}

export interface MatchInspirationResponse {
  message: string;
  matches: InspirationMatch[];
  totalMatches: number;
}

export interface GetInspirationsResponse {
  message: string;
  inspirations: InspirationImage[];
}

export interface DeleteInspirationResponse {
  message: string;
}
