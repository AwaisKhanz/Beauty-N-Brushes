// ================================
// API Response Types
// ================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ================================
// Auth Types (re-exported from shared)
// ================================

import type { UserRole } from '@/shared-types/auth.types';

export type {
  UserRole,
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenPayload,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/shared-types/auth.types';

// ================================
// User Types
// ================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

// ================================
// Provider Types
// ================================

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  tagline?: string;
  description?: string;
  city: string;
  state: string;
  zipCode: string;
  logoUrl?: string;
  coverPhotoUrl?: string;
  averageRating: number;
  totalReviews: number;
  instagramHandle?: string;
  isSalon: boolean;
}

// ================================
// Service Types
// ================================

export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceMin: number;
  priceMax?: number;
  priceType: 'fixed' | 'range' | 'starting_at';
  currency: string;
  durationMinutes: number;
  categoryId: string;
  active: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
}

// ================================
// Booking Types
// ================================

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  depositAmount: number;
  currency: string;
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_PROVIDER'
  | 'COMPLETED'
  | 'NO_SHOW';

export type PaymentStatus =
  | 'PENDING'
  | 'DEPOSIT_PAID'
  | 'FULLY_PAID'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

// ================================
// Review Types
// ================================

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  overallRating: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  reviewText?: string;
  createdAt: string;
}

// ================================
// Onboarding Types
// ================================

export interface OnboardingStatus {
  hasProfile: boolean;
  completed: boolean;
  steps: {
    accountType: boolean;
    businessDetails: boolean;
    profileMedia: boolean;
    brandCustomization: boolean;
    policies: boolean;
    paymentSetup: boolean;
    serviceCreated: boolean;
    availabilitySet: boolean;
  };
  profile?: {
    isSalon: boolean;
    businessName?: string | null;
    description?: string | null;
    tagline?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    businessPhone?: string | null;
    instagramHandle?: string | null;
    websiteUrl?: string | null;
    brandColorPrimary?: string | null;
    brandColorSecondary?: string | null;
    brandColorAccent?: string | null;
    brandFontHeading?: string | null;
    brandFontBody?: string | null;
    logoUrl?: string | null;
    coverPhotoUrl?: string | null;
    avatarUrl?: string | null;
    policies?: any;
    subscriptionTier?: string | null;
  };
}

// ================================
// Payment Types
// ================================

export type RegionCode = 'NA' | 'EU' | 'GH' | 'NG';
export type PaymentProvider = 'stripe' | 'paystack';
