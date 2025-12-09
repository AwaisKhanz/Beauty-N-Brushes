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
  AuthUser,
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
  Service,
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
  // Location
  CreateLocationRequest,
  UpdateLocationManagementRequest,
  CreateLocationResponse,
  UpdateLocationResponse,
  GetLocationResponse,
  GetLocationsResponse,
  DeleteLocationResponse,
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
  RescheduleBookingRequest,
  RescheduleBookingResponse,
  CompleteBookingRequest,
  CompleteBookingResponse,
  AssignTeamMemberRequest,
  AssignTeamMemberResponse,
  GetAvailableStylists,
  GetAvailableSlotsResponse,
  ReportNoShowRequest,
  ReportNoShowResponse,
  // Payment
  InitializeBookingPaymentRequest,
  InitializeBookingPaymentResponse,
  PayTipRequest,
  RequestRescheduleRequest,
  RequestRescheduleResponse,
  RespondToRescheduleRequest,
  RespondToRescheduleResponse,
  // Review
  Review,
  CreateReviewRequest,
  CreateReviewResponse,
  GetReviewsResponse,
  GetMyReviewsResponse,
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
  // Saved Search
  CreateSavedSearchRequest,
  CreateSavedSearchResponse,
  GetSavedSearchesResponse,
  GetSavedSearchResponse,
  UpdateSavedSearchRequest,
  UpdateSavedSearchResponse,
  DeleteSavedSearchResponse,
  // Message
  CreateMessageRequest,
  CreateMessageResponse,
  GetConversationsResponse,
  GetMessagesResponse,
  UpdateConversationResponse,
  // AI Messaging
  GenerateMessageDraftRequest,
  GenerateMessageDraftResponse,
  ChatbotQueryRequest,
  ChatbotQueryResponse,
  // Finance
  GetFinanceSummaryResponse,
  GetEarningsBreakdownResponse,
  GetPayoutHistoryResponse,
  GetBookingFinancialsResponse,
  CreatePayoutResponse,
  // Analytics
  GetAnalyticsSummaryResponse,
  GetBookingTrendsResponse,
  GetServicePerformanceResponse,
  GetClientDemographicsResponse,
  GetRevenueBreakdownResponse,
  // Instagram
  ConnectInstagramResponse,
  ImportInstagramMediaResponse,
  GetImportedMediaResponse,
  SaveImportedMediaRequest,
  SaveImportedMediaResponse,
  LinkMediaToServiceRequest,
  LinkMediaToServiceResponse,
  DisconnectInstagramResponse,
  // Client Management
  GetClientsResponse,
  GetClientDetailResponse,
  CreateClientNoteRequest,
  CreateClientNoteResponse,
  UpdateClientNoteRequest,
  UpdateClientNoteResponse,
  // Notifications
  GetNotificationsResponse,
  MarkAsReadResponse as NotificationMarkAsReadResponse,
  GetUnreadCountResponse,
  AcceptInvitationResponse,
  // Subscription Config
  SubscriptionConfigResponse,
  UpdateSubscriptionConfigRequest,
} from '../../../shared-types';
import { RegionCode, PaymentProvider } from '../../../shared-constants';

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
      apiClient.get<{ data: { services: Service[] } }>(`/services/${serviceId}/related`),

    getReviews: (serviceId: string) =>
      apiClient.get<{ data: { reviews: Review[] } }>(`/services/${serviceId}/reviews`),
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

    // NEW: Initialize Paystack subscription (for provider onboarding)
    initializePaystackSubscription: (data: { email: string; subscriptionTier: 'solo' | 'salon' }) =>
      apiClient.post<{
        data: {
          subscriptionCode: string;
          emailToken: string;
          authorizationUrl: string;
          nextPaymentDate: string;
          amount: number;
          status: string;
        };
      }>('/payment/paystack/subscription/initialize', data),

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

    // Pay balance for booking
    payBalance: (data: { bookingId: string }) =>
      apiClient.post<{ success: boolean; message: string }>('/payment/booking/pay-balance', data),

    // Pay tip for completed booking
    payTip: (data: PayTipRequest) =>
      apiClient.post<{
        data: {
          message: string;
          tipAmount: number;
          currency: string;
          authorizationUrl?: string;
          paymentIntentId?: string;
        };
      }>('/payment/booking/pay-tip', data),
  },

  // ============================================
  // User Profile APIs
  // ============================================
    users: {
      getPaymentMethods: () =>
        apiClient.get<{
          data: {
            paymentMethods: Array<{
              id: string;
              last4: string | null;
              brand: string | null;
              type: 'stripe' | 'paystack';
            }>;
            regionCode?: string | null;
          };
        }>('/users/payment-methods'),
      createSetupIntent: () =>
        apiClient.post<{
          data: {
            message: string;
            clientSecret: string;
          };
        }>('/users/payment-methods/setup-intent', {}),
      initializePaystackPaymentMethod: () =>
        apiClient.post<{
          data: {
            message: string;
            authorizationUrl: string;
            reference: string;
          };
        }>('/users/payment-methods/initialize-paystack', {}),
    addPaymentMethod: (data: { paymentMethodId: string; last4?: string | null; brand?: string | null }) =>
      apiClient.post<{
        data: {
          message: string;
          paymentMethod: {
            id: string;
            last4: string | null;
            brand: string | null;
            type: 'stripe' | 'paystack';
          };
        };
      }>('/users/payment-methods', data),
    updateProfile: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      bio?: string;
      avatarUrl?: string;
      hairType?: string;
      hairTexture?: string;
      hairPreferences?: string;
    }) => apiClient.put<{ data: { message: string; user: AuthUser } }>('/users/profile', data),

    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.put<{ data: { message: string } }>('/users/password', data),

    updateRegion: (data: { regionCode: RegionCode }) =>
      apiClient.put<{
        data: {
          message: string;
          regionCode: string;
          currency: string;
          paymentProvider: PaymentProvider;
        };
      }>('/users/region', data),

    updateNotifications: (data: {
      emailNotificationsEnabled?: boolean;
      smsNotificationsEnabled?: boolean;
    }) =>
      apiClient.put<{ data: { message: string; user: AuthUser } }>('/users/notifications', data),

    deactivate: () => apiClient.post<{ data: { message: string } }>('/users/deactivate', {}),

    delete: () => apiClient.delete<{ data: { message: string } }>('/users/me'),
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

    createSetupIntent: () =>
      apiClient.post<{
        data: {
          message: string;
          clientSecret: string;
        };
      }>('/settings/payment-method/setup-intent', {}),
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

    resumeSubscription: () =>
      apiClient.post<{ data: { message: string } }>('/settings/subscription/resume', {}),
  },

  // ============================================
  // Subscription Management APIs (New)
  // ============================================
  subscription: {
    // Get subscription details
    getDetails: () =>
      apiClient.get<{
        data: {
          subscription: {
            status: string;
            tier: string;
            monthlyFee: number;
            currency: string;
            trialEndDate: string | null;
            paymentProvider: string;
            id?: string;
            currentPeriodStart?: Date;
            currentPeriodEnd?: Date;
            cancelAtPeriodEnd?: boolean;
            canceledAt?: Date | null;
            isPaused?: boolean;
            pauseResumesAt?: Date | null;
            nextPaymentDate?: string;
          };
        };
      }>('/subscription'),

    // Pause subscription
    pause: () =>
      apiClient.post<{
        data: {
          message: string;
          subscription?: {
            id: string;
            status: string;
            pausedAt: Date;
          };
        };
      }>('/subscription/pause', {}),

    // Resume subscription
    resume: () =>
      apiClient.post<{
        data: {
          message: string;
          subscription?: {
            id: string;
            status: string;
            resumedAt: Date;
            nextBillingDate: Date;
          };
        };
      }>('/subscription/resume', {}),

    // Cancel subscription
    cancel: (data: { cancelAtPeriodEnd?: boolean }) =>
      apiClient.post<{
        data: {
          message: string;
          subscription?: {
            id: string;
            status: string;
            cancelAtPeriodEnd: boolean;
            currentPeriodEnd: Date;
          };
        };
      }>('/subscription/cancel', data),
  },

  // ============================================
  // Subscription Config APIs (Admin + Public)
  // ============================================
  subscriptionConfig: {
    // Get subscription configuration (public - anyone can view)
    get: () =>
      apiClient.get<{ data: { config: SubscriptionConfigResponse } }>('/onboarding/subscription-config'),

    // Update subscription configuration (admin only)
    update: (data: UpdateSubscriptionConfigRequest) =>
      apiClient.put<{ data: { config: SubscriptionConfigResponse } }>(
        '/admin/subscription-config',
        data
      ),
  },

  // ============================================
  // Location Management APIs
  // ============================================
  locations: {
    // Get all locations
    getAll: () => apiClient.get<{ data: GetLocationsResponse }>('/locations'),

    // Get location by ID
    getById: (locationId: string) =>
      apiClient.get<{ data: GetLocationResponse }>(`/locations/${locationId}`),

    // Create location
    create: (data: CreateLocationRequest) =>
      apiClient.post<{ data: CreateLocationResponse }>('/locations', data),

    // Update location
    update: (locationId: string, data: UpdateLocationManagementRequest) =>
      apiClient.put<{ data: UpdateLocationResponse }>(`/locations/${locationId}`, data),

    // Delete location
    delete: (locationId: string) =>
      apiClient.delete<{ data: DeleteLocationResponse }>(`/locations/${locationId}`),
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

    // Invitation methods
    getInvitation: (invitationId: string) =>
      apiClient.get<{
        data: {
          invitation: {
            id: string;
            salonName: string;
            role: string;
            invitedEmail: string;
            invitedAt: string;
          };
        };
      }>(`/team/invitation/${invitationId}`),

    acceptInvitation: (invitationId: string) =>
      apiClient.post<{ data: AcceptInvitationResponse }>(`/team/accept/${invitationId}`),

    declineInvitation: (invitationId: string) =>
      apiClient.post<{ data: { message: string } }>(`/team/decline/${invitationId}`),
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

    confirm: (bookingId: string) =>
      apiClient.post<{ data: UpdateBookingResponse }>(`/bookings/${bookingId}/confirm`),

    cancel: (bookingId: string, data: CancelBookingRequest) =>
      apiClient.post<{ data: CancelBookingResponse }>(`/bookings/${bookingId}/cancel`, {
        ...data,
        cancelledBy: 'client',
      }),

    // Provider cancels booking (always full refund to client)
    cancelByProvider: (bookingId: string, data: { reason: string }) =>
      apiClient.post<{ data: CancelBookingResponse }>(`/bookings/${bookingId}/cancel`, {
        ...data,
        cancelledBy: 'provider',
      }),

    reschedule: (bookingId: string, data: RescheduleBookingRequest) =>
      apiClient.put<{ data: RescheduleBookingResponse }>(
        `/bookings/${bookingId}/reschedule`,
        data
      ),

    complete: (bookingId: string, data: CompleteBookingRequest) =>
      apiClient.post<{ data: CompleteBookingResponse }>(`/bookings/${bookingId}/complete`, data),

    markNoShow: (bookingId: string, data: { notes?: string }) =>
      apiClient.post<{ data: UpdateBookingResponse }>(`/bookings/${bookingId}/no-show`, data),

    // Client reports provider no-show (full refund)
    reportProviderNoShow: (bookingId: string, data: ReportNoShowRequest) =>
      apiClient.post<{ data: ReportNoShowResponse }>(`/bookings/${bookingId}/report-provider-no-show`, data),

    // Salon-specific: Team member assignment
    assign: (bookingId: string, data: AssignTeamMemberRequest) =>
      apiClient.post<{ data: AssignTeamMemberResponse }>(
        `/bookings/${bookingId}/assign-team-member`,
        data
      ),

    // Alias for assign (for backward compatibility)
    assignTeamMember: (bookingId: string, data: AssignTeamMemberRequest) =>
      apiClient.post<{ data: AssignTeamMemberResponse }>(
        `/bookings/${bookingId}/assign-team-member`,
        data
      ),

    // Photos
    addPhoto: (bookingId: string, data: { photoUrl: string; photoType: 'BEFORE' | 'AFTER' | 'REFERENCE'; caption?: string }) =>
      apiClient.post<{ data: { message: string; photo: any } }>(`/bookings/${bookingId}/photos`, data),

    // Get booking photos
    getPhotos: (bookingId: string) =>
      apiClient.get<{ data: { message: string; photos: any[] } }>(`/bookings/${bookingId}/photos`),

    // Get refunds for a booking
    getRefunds: (bookingId: string) =>
      apiClient.get<{ message: string; refunds: any[] }>(`/bookings/${bookingId}/refunds`),

    deletePhoto: (bookingId: string, photoId: string) =>
      apiClient.delete<{ data: { message: string } }>(`/bookings/${bookingId}/photos/${photoId}`),

    // Pending reviews
    getPendingReviews: () =>
      apiClient.get<{ data: { message: string; bookings: any[] } }>('/bookings/pending-reviews'),

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

    // Request reschedule (provider only)
    requestReschedule: (bookingId: string, data: RequestRescheduleRequest) =>
      apiClient.post<{ data: RequestRescheduleResponse }>(
        `/bookings/${bookingId}/request-reschedule`,
        data
      ),

    // Respond to reschedule request (client only)
    respondToRescheduleRequest: (requestId: string, data: RespondToRescheduleRequest) =>
      apiClient.post<{ data: RespondToRescheduleResponse }>(
        `/bookings/reschedule-requests/${requestId}/respond`,
        data
      ),
  },

  // ============================================
  // Notification APIs
  // ============================================
  notifications: {
    getAll: (params?: { page?: number; limit?: number }) =>
      apiClient.get<{ data: GetNotificationsResponse }>('/notifications', params),

    markAsRead: (notificationId: string) =>
      apiClient.put<{ data: NotificationMarkAsReadResponse }>(`/notifications/${notificationId}/read`, {}),

    markAllAsRead: () =>
      apiClient.put<{ data: { message: string; count: number } }>('/notifications/read-all', {}),

    getUnreadCount: () =>
      apiClient.get<{ data: GetUnreadCountResponse }>('/notifications/unread-count'),
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

    // Get reviews created by current user
    getMyReviews: (params?: { page?: number; limit?: number }) =>
      apiClient.get<{ data: GetMyReviewsResponse }>(
        `/reviews/my-reviews${params ? `?page=${params.page || 1}&limit=${params.limit || 10}` : ''}`
      ),

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

  // ============================================
  // Saved Search APIs
  // ============================================
  savedSearches: {
    // Create a new saved search
    create: (data: CreateSavedSearchRequest) =>
      apiClient.post<{ data: CreateSavedSearchResponse }>('/saved-searches', data),

    // Get all saved searches
    getAll: () => apiClient.get<{ data: GetSavedSearchesResponse }>('/saved-searches'),

    // Get single saved search
    getById: (searchId: string) =>
      apiClient.get<{ data: GetSavedSearchResponse }>(`/saved-searches/${searchId}`),

    // Update saved search
    update: (searchId: string, data: UpdateSavedSearchRequest) =>
      apiClient.put<{ data: UpdateSavedSearchResponse }>(`/saved-searches/${searchId}`, data),

    // Delete saved search
    delete: (searchId: string) =>
      apiClient.delete<{ data: DeleteSavedSearchResponse }>(`/saved-searches/${searchId}`),
  },

  // ============================================
  // Message APIs
  // ============================================
  messages: {
    // Send a message
    send: (data: CreateMessageRequest) =>
      apiClient.post<{ data: CreateMessageResponse }>('/messages/send', data),

    // Create empty conversation
    createConversation: (data: { providerId: string }) =>
      apiClient.post<{ data: { conversation: any } }>('/messages/conversations', data),

    // Get conversations
    getConversations: (params?: { page?: number; limit?: number; status?: string }) =>
      apiClient.get<{ data: GetConversationsResponse }>('/messages/conversations', params),

    // Get messages in a conversation
    getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
      apiClient.get<{ data: GetMessagesResponse }>(
        `/messages/conversations/${conversationId}/messages`,
        params
      ),

    // Mark messages as read
    markAsRead: (conversationId: string) =>
      apiClient.post<{ data: { message: string; markedCount: number } }>('/messages/mark-read', {
        conversationId,
      }),

    // Update conversation status
    updateConversation: (conversationId: string, status: 'active' | 'archived' | 'blocked') =>
      apiClient.put<{ data: UpdateConversationResponse }>(
        `/messages/conversations/${conversationId}`,
        { status }
      ),

    // AI-powered message draft generation
    generateDraft: (data: GenerateMessageDraftRequest) =>
      apiClient.post<{ data: GenerateMessageDraftResponse }>('/messages/ai/generate-draft', data),

    // AI chatbot query
    chatbot: (data: ChatbotQueryRequest) =>
      apiClient.post<{ data: ChatbotQueryResponse }>('/messages/ai/chatbot', data),
  },

  // ============================================
  // Finance APIs
  // ============================================
  finance: {
    // Get finance summary
    getSummary: (params?: { startDate?: string; endDate?: string }) =>
      apiClient.get<{ data: GetFinanceSummaryResponse }>('/finance/summary', params),

    // Get earnings breakdown
    getEarningsBreakdown: (params: {
      startDate: string;
      endDate: string;
      interval?: 'day' | 'week' | 'month';
    }) => apiClient.get<{ data: GetEarningsBreakdownResponse }>('/finance/earnings', params),

    // Get payout history
    getPayouts: (params?: {
      page?: number;
      limit?: number;
      status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    }) => apiClient.get<{ data: GetPayoutHistoryResponse }>('/finance/payouts', params),

    // Get booking financials
    getBookings: (params?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      paymentStatus?: string;
      bookingStatus?: string;
    }) => apiClient.get<{ data: GetBookingFinancialsResponse }>('/finance/bookings', params),

    // Create payout request
    createPayout: (data: { amount: number; bookingIds: string[] }) =>
      apiClient.post<{ data: CreatePayoutResponse }>('/finance/payouts', data),
  },

  // ============================================
  // Analytics APIs
  // ============================================
  analytics: {
    // Get analytics summary
    getSummary: (params?: { startDate?: string; endDate?: string }) =>
      apiClient.get<{ data: GetAnalyticsSummaryResponse }>('/analytics/summary', params),

    // Get booking trends
    getTrends: (params: {
      startDate: string;
      endDate: string;
      interval?: 'day' | 'week' | 'month';
    }) => apiClient.get<{ data: GetBookingTrendsResponse }>('/analytics/trends', params),

    // Get service performance
    getServices: (params?: {
      startDate?: string;
      endDate?: string;
      sortBy?: 'bookings' | 'revenue' | 'rating';
      limit?: number;
    }) => apiClient.get<{ data: GetServicePerformanceResponse }>('/analytics/services', params),

    // Get client demographics
    getClients: (params?: { startDate?: string; endDate?: string }) =>
      apiClient.get<{ data: GetClientDemographicsResponse }>('/analytics/clients', params),

    // Get revenue breakdown
    getRevenue: (params?: { startDate?: string; endDate?: string }) =>
      apiClient.get<{ data: GetRevenueBreakdownResponse }>('/analytics/revenue', params),
  },

  // ============================================
  // Instagram APIs
  // ============================================
  instagram: {
    // Initiate Instagram OAuth connection
    connect: () => apiClient.get<{ data: ConnectInstagramResponse }>('/instagram/connect'),

    // Get media from Instagram (not yet imported)
    getMedia: () => apiClient.get<{ data: ImportInstagramMediaResponse }>('/instagram/media'),

    // Get imported media from database
    getImported: () => apiClient.get<{ data: GetImportedMediaResponse }>('/instagram/imported'),

    // Import selected media to platform
    import: (data: SaveImportedMediaRequest) =>
      apiClient.post<{ data: SaveImportedMediaResponse }>('/instagram/import', data),

    // Link media to service
    linkToService: (data: LinkMediaToServiceRequest) =>
      apiClient.post<{ data: LinkMediaToServiceResponse }>('/instagram/link-to-service', data),

    // Disconnect Instagram
    disconnect: () =>
      apiClient.post<{ data: DisconnectInstagramResponse }>('/instagram/disconnect'),
  },

  // ============================================
  // Client Management APIs
  // ============================================
  clients: {
    // Get all clients
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: 'name' | 'bookings' | 'lastBooking' | 'totalSpent';
      sortOrder?: 'asc' | 'desc';
    }) => apiClient.get<{ data: GetClientsResponse }>('/clients', params),

    // Get client detail
    getById: (clientId: string) =>
      apiClient.get<{ data: GetClientDetailResponse }>(`/clients/${clientId}`),

    // Create client note
    createNote: (data: CreateClientNoteRequest) =>
      apiClient.post<{ data: CreateClientNoteResponse }>('/clients/notes', data),

    // Update client note
    updateNote: (noteId: string, data: UpdateClientNoteRequest) =>
      apiClient.put<{ data: UpdateClientNoteResponse }>(`/clients/notes/${noteId}`, data),

    // Delete client note
    deleteNote: (noteId: string) =>
      apiClient.delete<{ data: { message: string } }>(`/clients/notes/${noteId}`),
  },

  // ============================================
  // Client Notes APIs
  // ============================================
  clientNotes: {
    // Create client note
    createNote: (data: CreateClientNoteRequest) =>
      apiClient.post<{ data: CreateClientNoteResponse }>('/clients/notes', data),

    // Update client note
    updateNote: (noteId: string, data: UpdateClientNoteRequest) =>
      apiClient.put<{ data: UpdateClientNoteResponse }>(`/clients/notes/${noteId}`, data),

    // Delete client note
    deleteNote: (noteId: string) =>
      apiClient.delete<{ data: { message: string } }>(`/clients/notes/${noteId}`),
  },
};
