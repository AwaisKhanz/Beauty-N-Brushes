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
  UpdateBusinessDetailsRequest,
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
  SaveServiceMediaRequest,
  SaveServiceMediaResponse,
  GenerateServiceDescriptionRequest,
  GenerateServiceDescriptionResponse,
  // Upload
  UploadFileResponse,
  UploadMultipleFilesResponse,
  DeleteFileRequest,
  DeleteFileResponse,
  // Payment
  InitializePaystackRequest,
  InitializePaystackResponse,
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

    updateBusinessDetails: (data: UpdateBusinessDetailsRequest) =>
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

    saveMedia: (serviceId: string, data: SaveServiceMediaRequest) =>
      apiClient.post<{ data: SaveServiceMediaResponse }>(`/services/${serviceId}/media`, data),

    generateDescription: (data: GenerateServiceDescriptionRequest) =>
      apiClient.post<{ data: GenerateServiceDescriptionResponse }>(
        '/ai/generate-service-description',
        data
      ),
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
      apiClient.get<any>(`/payment/paystack/verify/${reference}`),
  },
};
