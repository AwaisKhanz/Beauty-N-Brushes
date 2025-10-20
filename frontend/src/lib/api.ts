/**
 * Typed API Client
 * Provides type-safe API calls using shared types
 */

import { apiClient } from './api-client';
import type {
  // Auth
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  // Onboarding
  CreateAccountTypeRequest,
  CreateAccountTypeResponse,
  UpdateBusinessDetailsRequest as OnboardingBusinessDetailsRequest,
  UpdateBusinessDetailsResponse,
  SaveProfileMediaRequest,
  SaveProfileMediaResponse,
  UpdateBrandCustomizationRequest,
  UpdateBrandCustomizationResponse,
  GenerateAIPoliciesRequest,
  GenerateAIPoliciesResponse,
  SavePoliciesRequest,
  SavePoliciesResponse,
  SetupPaymentRequest,
  SetupPaymentResponse,
  SetupAvailabilityRequest,
  SetupAvailabilityResponse,
  OnboardingStatusResponse,
  CompleteOnboardingResponse,
  // Service
  CreateServiceRequest,
  CreateServiceResponse,
  GetServiceResponse,
  GetServicesResponse,
  GetDraftServicesResponse,
  SaveServiceMediaRequest,
  SaveServiceMediaResponse,
  GenerateServiceDescriptionRequest,
  GenerateServiceDescriptionResponse,
  GenerateHashtagsRequest,
  GenerateHashtagsResponse,
  AnalyzeImageRequest,
  AnalyzeImageResponse,
  // Public Search
  SearchServicesRequest,
  SearchServicesResponse,
  FeaturedServicesResponse,
  CategoriesResponse,
  GetPublicProviderProfileResponse,
  // Service Drafts
  SaveDraftRequest,
  SaveDraftResponse,
  GetDraftResponse,
  // Upload
  UploadFileResponse,
  UploadMultipleFilesResponse,
  DeleteFileRequest,
  DeleteFileResponse,
  // Payment
  InitializePaystackRequest,
  InitializePaystackResponse,
  VerifyPaystackTransactionResponse,
  // Dashboard
  GetDashboardStatsResponse,
  GetRecentBookingsResponse,
  GetClientDashboardStatsResponse,
  GetClientRecentBookingsResponse,
  // Calendar
  GetAvailabilityResponse,
  UpdateAvailabilityRequest,
  UpdateAvailabilityResponse,
  CreateBlockedDateRequest,
  CreateBlockedDateResponse,
  GetBlockedDatesResponse,
  DeleteBlockedDateResponse,
  // Inspiration
  AnalyzeInspirationRequest,
  AnalyzeInspirationResponse,
  MatchInspirationRequest,
  MatchInspirationResponse,
  // Settings
  UpdateProfileSettingsRequest,
  UpdateBookingSettingsRequest,
  UpdatePoliciesRequest,
  UpdateNotificationSettingsRequest,
  UpdateAccountRequest,
  UpdatePaymentMethodRequest,
  ProviderSettingsResponse,
  ProviderPoliciesResponse,
  SubscriptionInfoResponse,
  NotificationSettingsResponse,
  BrandingSettingsResponse,
  UpdateBrandingRequest,
  LocationSettingsResponse,
  UpdateLocationRequest,
  BusinessDetailsResponse,
  UpdateBusinessDetailsSettingsRequest,
  GoogleCalendarConnectionResponse,
  GoogleCalendarConnectResponse,
  GoogleCalendarDisconnectResponse,
  ChangeTierRequest,
  ChangeTierResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  // Team
  InviteTeamMemberRequest,
  InviteTeamMemberResponse,
  GetTeamMembersResponse,
  GetTeamMemberResponse,
  UpdateTeamMemberRequest,
  UpdateTeamMemberResponse,
  DeleteTeamMemberResponse,
  GetTeamAnalyticsResponse,
  // Booking
  CreateBookingRequest,
  CreateBookingResponse,
  GetBookingResponse,
  GetBookingsResponse,
  UpdateBookingRequest,
  UpdateBookingResponse,
  CancelBookingRequest,
  CancelBookingResponse,
  CompleteBookingRequest,
  CompleteBookingResponse,
  AssignTeamMemberRequest,
  AssignTeamMemberResponse,
  GetAvailableStylists,
  GetAvailableSlotsResponse,
  // Payment
  InitializeBookingPaymentRequest,
  InitializeBookingPaymentResponse,
  // Review
  CreateReviewRequest,
  CreateReviewResponse,
  GetReviewsResponse,
  GetReviewResponse,
  UpdateReviewRequest,
  UpdateReviewResponse,
  DeleteReviewResponse,
  ProviderResponseRequest,
  AddProviderResponseResponse,
  MarkReviewHelpfulResponse,
  // Like
  ToggleLikeRequest,
  ToggleLikeResponse,
  GetLikesResponse,
  CheckLikeStatusResponse,
  // Favorite
  ToggleFavoriteResponse,
  GetFavoritesResponse,
} from '../../../shared-types';

export const api = {
  // ============================================
  // Auth APIs
  // ============================================
  auth: {
    login: (data: LoginRequest) => apiClient.post<{ data: AuthResponse }>('/auth/login', data),

    register: (data: RegisterRequest) =>
      apiClient.post<{ data: AuthResponse }>('/auth/register', data),

    verifyEmail: (token: string) =>
      apiClient.get<{ success: boolean; message: string }>(`/auth/verify-email/${token}`),

    resendVerification: (email: string) =>
      apiClient.post<{ success: boolean; message: string }>('/auth/resend-verification', { email }),

    forgotPassword: (email: string) =>
      apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }),

    validateResetToken: (token: string) =>
      apiClient.get<{ success: boolean; valid: boolean }>(
        `/auth/validate-reset-token?token=${token}`
      ),

    resetPassword: (token: string, password: string, confirmPassword: string) =>
      apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', {
        token,
        password,
        confirmPassword,
      }),

    me: () => apiClient.get<{ data: { user: AuthResponse['user'] } }>('/auth/me'),

    logout: () => apiClient.post<{ success: boolean; message: string }>('/auth/logout'),
  },

  // ============================================
  // Onboarding APIs
  // ============================================
  onboarding: {
    createAccountType: (data: CreateAccountTypeRequest) =>
      apiClient.post<{ data: CreateAccountTypeResponse }>('/onboarding/account-type', data),

    updateBusinessDetails: (data: OnboardingBusinessDetailsRequest) =>
      apiClient.post<{ data: UpdateBusinessDetailsResponse }>('/onboarding/business-details', data),

    saveProfileMedia: (data: SaveProfileMediaRequest) =>
      apiClient.post<{ data: SaveProfileMediaResponse }>('/onboarding/profile-media', data),

    updateBrandCustomization: (data: UpdateBrandCustomizationRequest) =>
      apiClient.post<{ data: UpdateBrandCustomizationResponse }>(
        '/onboarding/brand-customization',
        data
      ),

    generatePolicies: (data: GenerateAIPoliciesRequest) =>
      apiClient.post<{ data: GenerateAIPoliciesResponse }>('/onboarding/generate-policies', data),

    savePolicies: (data: SavePoliciesRequest) =>
      apiClient.post<{ data: SavePoliciesResponse }>('/onboarding/policies', data),

    setupPayment: (data: SetupPaymentRequest) =>
      apiClient.post<{ data: SetupPaymentResponse }>('/onboarding/payment-setup', data),

    setupAvailability: (data: SetupAvailabilityRequest) =>
      apiClient.post<{ data: SetupAvailabilityResponse }>('/onboarding/availability', data),

    getStatus: () => apiClient.get<{ data: OnboardingStatusResponse }>('/onboarding/status'),

    complete: () => apiClient.post<{ data: CompleteOnboardingResponse }>('/onboarding/complete'),
  },

  // ============================================
  // Service APIs
  // ============================================
  services: {
    create: (data: CreateServiceRequest) =>
      apiClient.post<{ data: CreateServiceResponse }>('/services', data),

    getAll: () => apiClient.get<{ data: GetServicesResponse }>('/services'),

    getById: (serviceId: string) =>
      apiClient.get<{ data: GetServiceResponse }>(`/services/${serviceId}`),

    update: (serviceId: string, data: Partial<CreateServiceRequest>) =>
      apiClient.put<{ data: CreateServiceResponse }>(`/services/${serviceId}`, data),

    saveMedia: (serviceId: string, data: SaveServiceMediaRequest) =>
      apiClient.post<{ data: SaveServiceMediaResponse }>(`/services/${serviceId}/media`, data),

    generateDescription: (data: GenerateServiceDescriptionRequest) =>
      apiClient.post<{ data: GenerateServiceDescriptionResponse }>(
        '/services/ai/generate-description',
        data
      ),

    generateHashtags: (data: GenerateHashtagsRequest) =>
      apiClient.post<{ data: GenerateHashtagsResponse }>('/services/ai/generate-hashtags', data),

    analyzeImage: (data: AnalyzeImageRequest) =>
      apiClient.post<{ data: AnalyzeImageResponse }>('/services/ai/analyze-image', data),

    // Draft services
    getDrafts: () => apiClient.get<{ data: GetDraftServicesResponse }>('/services/drafts'),

    // Public search and discovery (no auth required)
    search: (params: SearchServicesRequest) => {
      // Flatten the params for query string
      const queryParams: Record<string, unknown> = {};

      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams[key] = value;
          }
        });
      }

      if (params.sort) {
        queryParams.sortField = params.sort.field;
        queryParams.sortOrder = params.sort.order;
      }

      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;

      return apiClient.get<{ data: SearchServicesResponse }>('/services/search', queryParams);
    },

    getFeatured: (limit?: number) =>
      apiClient.get<{ data: FeaturedServicesResponse }>('/services/featured', { limit }),

    getCategories: () => apiClient.get<{ data: CategoriesResponse }>('/services/categories'),

    getRelated: (serviceId: string) =>
      apiClient.get<{ data: { services: any[] } }>(`/services/${serviceId}/related`),

    getReviews: (serviceId: string) =>
      apiClient.get<{ data: { reviews: any[] } }>(`/services/${serviceId}/reviews`),
  },

  // ============================================
  // Service Draft APIs
  // ============================================
  serviceDrafts: {
    save: (data: SaveDraftRequest) =>
      apiClient.post<{ data: SaveDraftResponse }>('/service-drafts', data),

    get: () => apiClient.get<{ data: GetDraftResponse }>('/service-drafts'),

    delete: () => apiClient.delete<{ data: { message: string } }>('/service-drafts'),
  },

  // ============================================
  // Upload APIs
  // ============================================
  upload: {
    file: (file: File, type: string) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload?type=${type}`, {
        method: 'POST',
        credentials: 'include', // Send cookies with request
        body: formData,
      }).then((res) => res.json()) as Promise<UploadFileResponse>;
    },

    multiple: (files: File[], type: string) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/multiple?type=${type}`, {
        method: 'POST',
        credentials: 'include', // Send cookies with request
        body: formData,
      }).then((res) => res.json()) as Promise<UploadMultipleFilesResponse>;
    },

    delete: (data: DeleteFileRequest) => apiClient.delete<DeleteFileResponse>('/upload', data),
  },

  payment: {
    initializePaystack: (data: InitializePaystackRequest) =>
      apiClient.post<{ data: InitializePaystackResponse }>('/payment/paystack/initialize', data),

    verifyPaystack: (reference: string) =>
      apiClient.get<{ data: VerifyPaystackTransactionResponse['data'] }>(
        `/payment/paystack/verify/${reference}`
      ),

    // Initialize booking payment (Stripe/Paystack)
    initializeBookingPayment: (data: InitializeBookingPaymentRequest) =>
      apiClient.post<{ data: InitializeBookingPaymentResponse }>(
        '/payment/booking/initialize',
        data
      ),
  },

  // ============================================
  // Dashboard APIs
  // ============================================
  dashboard: {
    // Provider Dashboard
    getStats: () => apiClient.get<{ data: GetDashboardStatsResponse }>('/dashboard/stats'),

    getRecentBookings: () =>
      apiClient.get<{ data: GetRecentBookingsResponse }>('/dashboard/bookings/recent'),

    // Client Dashboard
    getClientStats: () =>
      apiClient.get<{ data: GetClientDashboardStatsResponse }>('/dashboard/client/stats'),

    getClientRecentBookings: (limit?: number) =>
      apiClient.get<{ data: GetClientRecentBookingsResponse }>(
        '/dashboard/client/bookings/recent',
        { limit }
      ),
  },

  // ============================================
  // Calendar & Availability APIs
  // ============================================
  calendar: {
    getAvailability: () =>
      apiClient.get<{ data: GetAvailabilityResponse }>('/calendar/availability'),

    updateAvailability: (data: UpdateAvailabilityRequest) =>
      apiClient.put<{ data: UpdateAvailabilityResponse }>('/calendar/availability', data),

    getBlockedDates: () =>
      apiClient.get<{ data: GetBlockedDatesResponse }>('/calendar/blocked-dates'),

    createBlockedDate: (data: CreateBlockedDateRequest) =>
      apiClient.post<{ data: CreateBlockedDateResponse }>('/calendar/blocked-dates', data),

    deleteBlockedDate: (blockedDateId: string) =>
      apiClient.delete<{ data: DeleteBlockedDateResponse }>(
        `/calendar/blocked-dates/${blockedDateId}`
      ),
  },

  // ============================================
  // Inspiration / Visual Search APIs (Ephemeral - No Storage)
  // ============================================
  inspiration: {
    // Step 1: Analyze image and get embedding
    analyze: (data: AnalyzeInspirationRequest) =>
      apiClient.post<{ data: AnalyzeInspirationResponse }>('/inspiration/analyze', data),

    // Step 2: Match embedding to provider services
    match: (data: MatchInspirationRequest) =>
      apiClient.post<{ data: MatchInspirationResponse }>('/inspiration/match', data),
  },

  // ============================================
  // Settings APIs
  // ============================================
  settings: {
    // Profile Settings
    getProfile: () => apiClient.get<{ data: ProviderSettingsResponse }>('/settings/profile'),

    updateProfile: (data: UpdateProfileSettingsRequest) =>
      apiClient.put<{ data: ProviderSettingsResponse }>('/settings/profile', data),

    // Booking Settings
    getBooking: () => apiClient.get<{ data: ProviderSettingsResponse }>('/settings/booking'),

    updateBooking: (data: UpdateBookingSettingsRequest) =>
      apiClient.put<{ data: ProviderSettingsResponse }>('/settings/booking', data),

    // Policies
    getPolicies: () => apiClient.get<{ data: ProviderPoliciesResponse }>('/settings/policies'),

    updatePolicies: (data: UpdatePoliciesRequest) =>
      apiClient.put<{ data: ProviderPoliciesResponse }>('/settings/policies', data),

    // Subscription
    getSubscription: () =>
      apiClient.get<{ data: SubscriptionInfoResponse }>('/settings/subscription'),

    updatePaymentMethod: (data: UpdatePaymentMethodRequest) =>
      apiClient.post<{ data: { message: string } }>('/settings/payment-method', data),

    // Notifications
    getNotifications: () =>
      apiClient.get<{ data: NotificationSettingsResponse }>('/settings/notifications'),

    updateNotifications: (data: UpdateNotificationSettingsRequest) =>
      apiClient.put<{ data: { message: string } }>('/settings/notifications', data),

    // Account
    updateAccount: (data: UpdateAccountRequest) =>
      apiClient.put<{ data: { message: string } }>('/settings/account', data),

    deactivateAccount: () => apiClient.post<{ data: { message: string } }>('/settings/deactivate'),

    // Branding
    getBranding: () => apiClient.get<{ data: BrandingSettingsResponse }>('/settings/branding'),

    updateBranding: (data: UpdateBrandingRequest) =>
      apiClient.put<{ data: BrandingSettingsResponse }>('/settings/branding', data),

    // Location
    getLocation: () => apiClient.get<{ data: LocationSettingsResponse }>('/settings/location'),

    updateLocation: (data: UpdateLocationRequest) =>
      apiClient.put<{ data: LocationSettingsResponse }>('/settings/location', data),

    // Business Details
    getBusinessDetails: () =>
      apiClient.get<{ data: BusinessDetailsResponse }>('/settings/business-details'),

    updateBusinessDetails: (data: UpdateBusinessDetailsSettingsRequest) =>
      apiClient.put<{ data: BusinessDetailsResponse }>('/settings/business-details', data),

    // Google Calendar
    getCalendarStatus: () =>
      apiClient.get<{ data: GoogleCalendarConnectionResponse }>('/settings/calendar-status'),

    // Subscription Management
    changeTier: (data: ChangeTierRequest) =>
      apiClient.post<{ data: ChangeTierResponse }>('/settings/subscription/change-tier', data),

    cancelSubscription: (data: CancelSubscriptionRequest) =>
      apiClient.post<{ data: CancelSubscriptionResponse }>('/settings/subscription/cancel', data),
  },

  // Google Calendar Integration
  googleCalendar: {
    connect: () =>
      apiClient.post<{ data: GoogleCalendarConnectResponse }>('/calendar/google/connect', {}),

    disconnect: () =>
      apiClient.post<{ data: GoogleCalendarDisconnectResponse }>('/calendar/google/disconnect', {}),
  },

  // ============================================
  // Team Management APIs (Salon Only)
  // ============================================
  team: {
    getAll: () => apiClient.get<{ data: GetTeamMembersResponse }>('/team'),

    getById: (memberId: string) =>
      apiClient.get<{ data: GetTeamMemberResponse }>(`/team/${memberId}`),

    invite: (data: InviteTeamMemberRequest) =>
      apiClient.post<{ data: InviteTeamMemberResponse }>('/team/invite', data),

    update: (memberId: string, data: UpdateTeamMemberRequest) =>
      apiClient.put<{ data: UpdateTeamMemberResponse }>(`/team/${memberId}`, data),

    delete: (memberId: string) =>
      apiClient.delete<{ data: DeleteTeamMemberResponse }>(`/team/${memberId}`),

    getAnalytics: () => apiClient.get<{ data: GetTeamAnalyticsResponse }>('/team/analytics'),
  },

  // ============================================
  // Booking APIs (With Team Member Support)
  // ============================================
  bookings: {
    create: (data: CreateBookingRequest) =>
      apiClient.post<{ data: CreateBookingResponse }>('/bookings', data),

    getAll: (params?: { page?: number; limit?: number }) =>
      apiClient.get<{ data: GetBookingsResponse }>('/bookings', params),

    getById: (bookingId: string) =>
      apiClient.get<{ data: GetBookingResponse }>(`/bookings/${bookingId}`),

    update: (bookingId: string, data: UpdateBookingRequest) =>
      apiClient.put<{ data: UpdateBookingResponse }>(`/bookings/${bookingId}`, data),

    cancel: (bookingId: string, data: CancelBookingRequest) =>
      apiClient.post<{ data: CancelBookingResponse }>(`/bookings/${bookingId}/cancel`, data),

    complete: (bookingId: string, data: CompleteBookingRequest) =>
      apiClient.post<{ data: CompleteBookingResponse }>(`/bookings/${bookingId}/complete`, data),

    // Salon-specific: Team member assignment
    assignTeamMember: (bookingId: string, data: AssignTeamMemberRequest) =>
      apiClient.post<{ data: AssignTeamMemberResponse }>(
        `/bookings/${bookingId}/assign-team-member`,
        data
      ),

    // Get available time slots for booking
    getAvailableSlots: (providerId: string, serviceId: string, date: string) =>
      apiClient.get<{ data: GetAvailableSlotsResponse }>(
        `/bookings/available-slots?providerId=${providerId}&serviceId=${serviceId}&date=${date}`
      ),

    getAvailableStylists: (params: {
      providerId: string;
      date: string;
      time: string;
      duration: number;
    }) =>
      apiClient.get<{ data: GetAvailableStylists }>(
        `/bookings/available-stylists?providerId=${params.providerId}&date=${params.date}&time=${params.time}&duration=${params.duration}`
      ),
  },

  // ============================================
  // Provider APIs (Public)
  // ============================================
  providers: {
    // Public provider profile (no auth required)
    getPublicProfile: (slug: string) =>
      apiClient.get<{ data: GetPublicProviderProfileResponse }>(`/providers/${slug}/public`),
  },

  // ============================================
  // Review APIs
  // ============================================
  reviews: {
    // Create review for completed booking
    create: (data: CreateReviewRequest) =>
      apiClient.post<{ data: CreateReviewResponse }>('/reviews', data),

    // Get reviews for a provider (public)
    getByProvider: (providerId: string, params?: { page?: number; limit?: number }) =>
      apiClient.get<{ data: GetReviewsResponse }>(
        `/reviews/provider/${providerId}${params ? `?page=${params.page || 1}&limit=${params.limit || 10}` : ''}`
      ),

    // Get single review by ID (public)
    getById: (reviewId: string) =>
      apiClient.get<{ data: GetReviewResponse }>(`/reviews/${reviewId}`),

    // Update own review
    update: (reviewId: string, data: UpdateReviewRequest) =>
      apiClient.put<{ data: UpdateReviewResponse }>(`/reviews/${reviewId}`, data),

    // Delete own review
    delete: (reviewId: string) =>
      apiClient.delete<{ data: DeleteReviewResponse }>(`/reviews/${reviewId}`),

    // Provider responds to review
    addResponse: (reviewId: string, data: ProviderResponseRequest) =>
      apiClient.post<{ data: AddProviderResponseResponse }>(`/reviews/${reviewId}/response`, data),

    // Toggle helpful mark
    toggleHelpful: (reviewId: string) =>
      apiClient.post<{ data: MarkReviewHelpfulResponse }>(`/reviews/${reviewId}/helpful`, {}),
  },

  // ============================================
  // Like APIs
  // ============================================
  likes: {
    // Toggle like on provider or service
    toggle: (data: ToggleLikeRequest) =>
      apiClient.post<{ data: ToggleLikeResponse }>('/likes', data),

    // Get user's liked items
    getMyLikes: (params?: { page?: number; limit?: number }) =>
      apiClient.get<{ data: GetLikesResponse }>(
        `/likes/my-likes${params ? `?page=${params.page || 1}&limit=${params.limit || 20}` : ''}`
      ),

    // Check like status for specific target
    checkStatus: (targetType: 'provider' | 'service', targetId: string) =>
      apiClient.get<{ data: CheckLikeStatusResponse }>(`/likes/status/${targetType}/${targetId}`),
  },

  // ============================================
  // Favorite APIs
  // ============================================
  favorites: {
    // Toggle favorite provider
    toggle: (providerId: string) =>
      apiClient.post<{ data: ToggleFavoriteResponse }>('/favorites/toggle', { providerId }),

    // Get all favorite providers
    getAll: () => apiClient.get<{ data: GetFavoritesResponse }>('/favorites'),
  },
};
