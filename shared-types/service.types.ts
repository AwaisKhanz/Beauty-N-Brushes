/**
 * Shared Service Types
 * Used by both frontend and backend
 */

export type PriceType = 'fixed' | 'range' | 'starting_at';
export type DepositType = 'percentage' | 'fixed';

// ============================================
// Request Types
// ============================================

export interface ServiceAddonInput {
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
}

export interface CreateServiceRequest {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priceMin: number;
  priceMax?: number;
  priceType: PriceType;
  durationMinutes: number;
  depositType: DepositType;
  depositAmount: number;
  addons?: ServiceAddonInput[];
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  active?: boolean;
}

export interface SaveServiceMediaRequest {
  mediaUrls: {
    url: string;
    thumbnailUrl?: string;
    mediumUrl?: string;
    largeUrl?: string;
    mediaType?: 'image' | 'video';
    caption?: string;
    displayOrder?: number;
    isFeatured?: boolean;
    // AI Tagging
    hairType?: string;
    styleType?: string;
    colorInfo?: string;
    complexityLevel?: string;
  }[];
}

export interface GenerateServiceDescriptionRequest {
  title: string;
  category: string;
  subcategory?: string;
  businessName?: string;
  tone?: 'professional' | 'friendly' | 'luxury' | 'casual' | 'energetic';
  includeHashtags?: boolean;
  includeKeywords?: boolean;
}

export interface GenerateHashtagsRequest {
  title: string;
  category: string;
  subcategory?: string;
  existingHashtags?: string[];
}

export interface AnalyzeImageRequest {
  imageUrl: string;
}

// ============================================
// Response Types
// ============================================

export interface ServiceAddon {
  id: string;
  serviceId: string;
  addonName: string;
  addonDescription?: string;
  addonPrice: number;
  addonDurationMinutes: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceMedia {
  id: string;
  serviceId: string;
  mediaType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  isFeatured?: boolean;
  displayOrder: number;
  processingStatus: string;
  moderationStatus: string;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Service {
  id: string;
  providerId: string;
  categoryId: string;
  subcategoryId?: string | null;
  title: string;
  description: string;
  priceType: PriceType;
  priceMin: number;
  priceMax?: number;
  currency: string;
  depositRequired: boolean;
  depositType: DepositType;
  depositAmount: number;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  category: ServiceCategory;
  addons: ServiceAddon[];
  media: ServiceMedia[];
  _count?: {
    bookings: number;
  };
  provider?: {
    id: string;
    businessName: string;
    logoUrl?: string;
    slug: string;
    regionCode: string;
    currency: string;
    user: {
      avatarUrl?: string;
    };
  };
}

export interface CreateServiceResponse {
  message: string;
  service: Service;
}

export interface UpdateServiceResponse {
  message: string;
  service: Service;
}

export interface GetServiceResponse {
  message: string;
  service: Service;
}

export interface GetServicesResponse {
  message: string;
  services: Service[];
}

export interface SaveServiceMediaResponse {
  message: string;
  count: number;
}

export interface GenerateServiceDescriptionResponse {
  message: string;
  description: string;
  hashtags?: string[];
  keywords?: string[];
  estimatedDuration?: number;
}

export interface GenerateHashtagsResponse {
  message: string;
  hashtags: string[];
}

export interface AnalyzeImageResponse {
  message: string;
  data: {
    hairType?: string;
    styleType?: string;
    colorInfo?: string;
    complexityLevel?: string;
  };
}
