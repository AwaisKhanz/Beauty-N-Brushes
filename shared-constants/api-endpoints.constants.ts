/**
 * API endpoint constants
 * Shared between frontend and backend
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VALIDATE_RESET_TOKEN: '/auth/validate-reset-token',
  },

  ONBOARDING: {
    ACCOUNT_TYPE: '/onboarding/account-type',
    BUSINESS_DETAILS: '/onboarding/business-details',
    PROFILE_MEDIA: '/onboarding/profile-media',
    BRAND_CUSTOMIZATION: '/onboarding/brand-customization',
    GENERATE_POLICIES: '/onboarding/generate-policies',
    POLICIES: '/onboarding/policies',
    PAYMENT_SETUP: '/onboarding/payment-setup',
    AVAILABILITY: '/onboarding/availability',
    STATUS: '/onboarding/status',
    COMPLETE: '/onboarding/complete',
  },

  SERVICES: {
    BASE: '/services',
    BY_ID: (serviceId: string) => `/services/${serviceId}`,
    MEDIA: (serviceId: string) => `/services/${serviceId}/media`,
  },

  AI: {
    GENERATE_SERVICE_DESCRIPTION: '/ai/generate-service-description',
  },

  UPLOAD: {
    SINGLE: '/upload',
    MULTIPLE: '/upload/multiple',
    DELETE: '/upload',
  },

  PAYMENT: {
    PAYSTACK_INITIALIZE: '/payment/paystack/initialize',
    PAYSTACK_VERIFY: (reference: string) => `/payment/paystack/verify/${reference}`,
  },

  PROVIDER: {
    PROFILE: '/provider/profile',
    SERVICES: '/provider/services',
  },
} as const;
