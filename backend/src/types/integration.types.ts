/**
 * Third-party Integration Types
 */

// Instagram
export interface InstagramAuthResponse {
  access_token: string;
  user_id: number;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

// AI
export interface PolicyGenerationParams {
  businessName: string;
  businessType?: string;
  serviceTypes: string[];
}

export interface GeneratedPolicies {
  cancellationPolicy: string;
  lateArrivalPolicy: string;
  refundPolicy: string;
}
