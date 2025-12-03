/**
 * Shared Inspiration Types
 * Used for AI-powered ephemeral visual search (no database storage)
 */

// ============================================
// Search Modes
// ============================================

export type SearchMode = 'balanced' | 'visual' | 'semantic' | 'style' | 'color';

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
  searchMode?: SearchMode; // Search strategy (balanced, visual, semantic, style, color)
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
  tags: string[]; // AI-extracted visual features (50-100+ comprehensive tags)
  description?: string; // Natural language description (3-5 sentences)
  embedding: number[]; // 1408-dimensional enriched embedding (image + tags + description)
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
  categoryName?: string; // Service category name

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
  aiTags?: string[]; // All AI tags from the matched media (50-100+)
  aiDescription?: string; // Natural language description of the matched media
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
