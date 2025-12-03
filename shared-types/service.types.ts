/**
 * Shared Service Types
 *
 * Comprehensive types for service creation, management, and public discovery.
 * Includes support for service add-ons, deposits, AI-generated content, and visual search.
 *
 * @module shared-types/service
 *
 * **Backend Usage:**
 * - `backend/src/controllers/service.controller.ts`
 * - `backend/src/services/service.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.services)
 * - `frontend/src/components/services/`
 * - `frontend/src/app/services/`
 */

/**
 * Service pricing type
 * @enum {string}
 */
export type PriceType = 'fixed' | 'range' | 'starting_at';

/**
 * Deposit calculation type (service-level, NOT policy-level)
 * @enum {string}
 */
export type DepositType = 'PERCENTAGE' | 'FLAT';

// ============================================
// Request Types
// ============================================

/**
 * Input structure for creating/updating service add-ons
 * @interface
 */
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
  // Mobile/Home service configuration
  mobileServiceAvailable?: boolean;
  homeServiceFee?: number;
  addons?: ServiceAddonInput[];
  // Template tracking
  createdFromTemplate?: boolean;
  templateId?: string;
  templateName?: string;
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
  // Deposits are ALWAYS mandatory per requirements
  depositType: DepositType;
  depositAmount: number;
  // Mobile/Home service configuration
  mobileServiceAvailable: boolean;
  homeServiceFee?: number;
  durationMinutes: number;
  active: boolean;
  // Template tracking
  createdFromTemplate?: boolean;
  templateId?: string | null;
  templateName?: string | null;
  // Draft status
  isDraft?: boolean;
  draftStep?: number;
  draftUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  category: ServiceCategory;
  subcategory?: ServiceCategory | null;
  addons: ServiceAddon[];
  media: ServiceMedia[];
  featuredImage?: ServiceMedia;
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
    instantBookingEnabled?: boolean;
    advanceBookingDays?: number;
    isSalon?: boolean;
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
    tags: string[];
  };
}

// ============================================
// Service Draft Types
// ============================================

export interface ServiceWizardData {
  // Basic Information
  title: string;
  category: string;
  subcategory?: string;

  // Template tracking
  createdFromTemplate?: boolean;
  templateId?: string;
  templateName?: string;

  // AI-Enhanced Description
  description: string;
  hashtags?: string[];
  keywords?: string[];

  // Pricing & Duration
  priceType: PriceType;
  priceMin: number;
  priceMax?: number;
  durationMinutes: number;

  // Deposit
  depositType: DepositType;
  depositAmount: number;

  // Media
  media: {
    url: string;
    thumbnailUrl?: string;
    mediaType: 'image' | 'video';
    caption?: string;
    isFeatured?: boolean;
    displayOrder: number;
  }[];

  // Add-ons & Variations
  addons?: {
    name: string;
    description?: string;
    price: number;
    duration: number;
  }[];

  variations?: {
    name: string;
    description?: string;
    priceAdjustment: number;
    durationAdjustment?: number;
  }[];
}

export interface ServiceDraftData {
  id?: string;
  draftData: Partial<ServiceWizardData>;
  currentStep: number;
  updatedAt: string;
}

export interface SaveDraftRequest {
  draftData: Partial<ServiceWizardData>;
  currentStep: number;
}

export interface SaveDraftResponse {
  message: string;
  draft: ServiceDraftData;
}

export interface GetDraftResponse {
  draft: ServiceDraftData | null;
}

// Draft Service Management
export interface DraftService {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  currentStep: number;
  lastSaved: string;
  isDraft: true;
}

export interface GetDraftServicesResponse {
  drafts: DraftService[];
  total: number;
}

export interface DeleteDraftServiceResponse {
  message: string;
}

// ============================================
// Public Search Types
// ============================================

export interface ServiceSearchFilters {
  // Text search
  query?: string;

  // Category filters
  category?: string;
  subcategory?: string;

  // Location filters
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // miles

  // Price filters
  priceMin?: number;
  priceMax?: number;

  // Other filters
  rating?: number; // minimum rating
  mobileService?: boolean;
  isSalon?: boolean; // true = salon only, false = solo only, undefined = both
  availability?: string; // ISO date string
}

export interface ServiceSearchSort {
  field: 'relevance' | 'price' | 'rating' | 'distance' | 'createdAt';
  order: 'asc' | 'desc';
}

export interface SearchServicesRequest {
  filters?: ServiceSearchFilters;
  sort?: ServiceSearchSort;
  page?: number;
  limit?: number;
}

export interface PublicServiceResult {
  id: string;
  title: string;
  description: string;
  priceMin: number;
  priceMax: number | null;
  priceType: string;
  currency: string;
  durationMinutes: number;
  category: string;
  subcategory: string | null;
  featuredImageUrl: string | null;
  // Provider info
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerLogoUrl: string | null;
  providerCity: string;
  providerState: string;
  providerRating: number;
  providerReviewCount: number;
  providerIsSalon: boolean;
  // Distance (if location provided)
  distance?: number;
}

export interface SearchServicesResponse {
  services: PublicServiceResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appliedFilters: ServiceSearchFilters;
}

export interface FeaturedServicesResponse {
  services: PublicServiceResult[];
  total: number;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  serviceCount: number;
  subcategories?: {
    id: string;
    name: string;
    slug: string;
    serviceCount: number;
  }[];
}

export interface CategoriesResponse {
  categories: CategoryWithCount[];
}

// ============================================
// Public Provider Profile Types
// ============================================

export interface PublicProviderProfile {
  id: string;
  businessName: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;

  // Location
  city: string;
  state: string;
  address: string | null;

  // Ratings
  averageRating: number;
  totalReviews: number;

  // Settings
  isSalon: boolean;
  acceptsNewClients: boolean;
  mobileServiceAvailable: boolean;

  // Services
  services: PublicServiceResult[];

  // Portfolio (Instagram media)
  portfolioImages: {
    id: string;
    imageUrl: string;
    caption: string | null;
  }[];

  // Reviews
  reviews: {
    id: string;
    clientName: string;
    clientAvatarUrl?: string;
    overallRating: number;
    reviewText?: string;
    providerResponse?: string;
    providerResponseDate?: string;
    helpfulCount: number;
    media: {
      id: string;
      fileUrl: string;
      thumbnailUrl?: string;
    }[];
    createdAt: string;
  }[];
}

export interface GetPublicProviderProfileResponse {
  provider: PublicProviderProfile;
}
