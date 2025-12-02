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
// Shared Types Re-exports
// ================================

// Auth Types
export type {
  UserRole,
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenPayload,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../../../shared-types/auth.types';

// Service Types
export type {
  Service,
  ServiceMedia,
  ServiceAddon,
  CreateServiceRequest,
  CreateServiceResponse,
  GetServiceResponse,
  GetServicesResponse,
  SearchServicesRequest,
  SearchServicesResponse,
} from '../../../shared-types/service.types';

// Booking Types
export type {
  BookingDetails,
  CreateBookingRequest,
  CreateBookingResponse,
  GetBookingResponse,
  GetBookingsResponse,
  BookingStatus,
  PaymentStatus,
} from '../../../shared-types/booking.types';

// Review Types
export type {
  Review,
  ReviewWithRelations,
  CreateReviewRequest,
  CreateReviewResponse,
  GetReviewsResponse,
  GetMyReviewsResponse,
} from '../../../shared-types/review.types';

// Onboarding Types
export type {
  OnboardingStatusResponse,
  AccountType,
  RegionCode,
  PaymentProvider,
} from '../../../shared-types/onboarding.types';

// ================================
// Message Types (re-exported from shared)
// ================================

export type {
  Conversation,
  Message,
  CreateMessageRequest,
  CreateMessageResponse,
  GetConversationsResponse,
  GetMessagesResponse,
  UpdateConversationResponse,
} from '../../../shared-types/message.types';

// ================================
// Frontend-Specific Helper Types
// ================================

// Note: User, Service, Booking, Review types are now imported from shared-types above
// Only keep frontend-specific UI types here

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
}

export interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
  message?: string;
  authorization?: {
    authorization_code: string;
    bin?: string;
    last4?: string;
    exp_month?: string;
    exp_year?: string;
    card_type?: string;
    bank?: string;
    country_code?: string;
    brand?: string;
    reusable?: boolean;
  };
}

export interface WindowWithPaystack extends Window {
  PaystackPop?: {
    setup: (config: {
      key: string;
      email: string;
      amount: number;
      currency: string;
      ref: string;
      metadata?: Record<string, unknown>;
      onClose: () => void;
      callback: (response: PaystackResponse) => void;
    }) => {
      openIframe: () => void;
    };
  };
}
