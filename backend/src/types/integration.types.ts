export interface PolicyGenerationParams {
  serviceType: string;
  businessType: 'salon' | 'spa' | 'barbershop' | 'nail_salon' | 'other';
  location: {
    country: string;
    state?: string;
    city?: string;
  };
  customRequirements?: string[];
}

export interface GeneratedPolicies {
  cancellationPolicy: {
    title: string;
    description: string;
    rules: string[];
    timeframes: {
      freeCancellation: string;
      partialRefund: string;
      noRefund: string;
    };
  };
  reschedulingPolicy: {
    title: string;
    description: string;
    rules: string[];
    timeframes: {
      freeReschedule: string;
      feeRequired: string;
      notAllowed: string;
    };
  };
  refundPolicy: {
    title: string;
    description: string;
    rules: string[];
    conditions: string[];
  };
  noShowPolicy: {
    title: string;
    description: string;
    rules: string[];
    penalties: string[];
  };
  lateArrivalPolicy: {
    title: string;
    description: string;
    rules: string[];
    gracePeriod: string;
  };
  depositPolicy: {
    title: string;
    description: string;
    rules: string[];
    refundConditions: string[];
  };
  healthAndSafetyPolicy: {
    title: string;
    description: string;
    rules: string[];
    requirements: string[];
  };
  serviceModificationPolicy: {
    title: string;
    description: string;
    rules: string[];
    changeFees: string[];
  };
}

export interface GoogleCloudConfig {
  projectId: string;
  location: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

export interface VisionAnalysisResult {
  labels: Array<{
    description: string;
    score: number;
  }>;
  faces: Array<{
    joy: number;
    sorrow: number;
    anger: number;
    surprise: number;
  }>;
  colors: Array<{
    color: {
      red: number;
      green: number;
      blue: number;
    };
    score: number;
    pixelFraction: number;
  }>;
  text: string;
  landmarks: Array<{
    description: string;
    location: {
      lat: number;
      lng: number;
    };
  }>;
}

export interface VertexAIConfig {
  projectId: string;
  location: string;
  modelName?: string;
}

// Instagram API Types
export interface InstagramAuthResponse {
  access_token: string;
  user_id: string;
  username?: string;
  account_type?: string;
  expires_in?: number;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  permalink: string;
  username?: string;
}
