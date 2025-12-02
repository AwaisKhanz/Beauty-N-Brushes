export type SearchMode = 'balanced' | 'visual' | 'style' | 'semantic' | 'color';

export interface ImageAnalysisResult {
  tags: string[];
  description?: string;
  embedding: number[];
}

export interface InspirationMatch {
  mediaId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  serviceId: string;
  serviceTitle: string;
  servicePriceMin: number;
  serviceCurrency: string;
  providerId: string;
  providerBusinessName: string;
  providerSlug: string;
  providerLogoUrl?: string | null;
  providerCity: string;
  providerState: string;
  matchScore: number;
  vectorScore: number;
  distance: number;
  matchingTags: string[];
  aiTags: string[];
  aiDescription?: string;
  finalScore: number;
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
