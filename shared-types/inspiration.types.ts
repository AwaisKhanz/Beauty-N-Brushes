/**
 * Shared Inspiration Types
 * Used for AI-powered ephemeral visual search (no database storage)
 */

// ============================================
// Request Types
// ============================================

export interface AnalyzeInspirationRequest {
  imageUrl: string;
  notes?: string;
}

export interface MatchInspirationRequest {
  embedding: number[]; // 1408-dimensional embedding from analyze step
  tags?: string[]; // AI tags for display purposes
  location?: {
    city: string;
    state?: string;
  };
  maxResults?: number;
}

// ============================================
// Response Types
// ============================================

export interface ImageAnalysisResult {
  tags: string[]; // AI-extracted visual features
  embedding: number[]; // 1408-dimensional enriched embedding (image + tags)
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

  // Match Info (Vector-Only Scoring)
  matchScore: number; // 0-100 (vector similarity only)
  vectorScore: number; // 0-100 (same as matchScore)
  distance: number; // Raw vector distance (lower is better)
  matchingTags: string[]; // Tags that matched (for display only)
  aiTags?: string[]; // All AI tags from the matched media
}

export interface AnalyzeInspirationResponse {
  message: string;
  analysis: ImageAnalysisResult;
}

export interface MatchInspirationResponse {
  message: string;
  matches: InspirationMatch[];
  totalMatches: number;
}
