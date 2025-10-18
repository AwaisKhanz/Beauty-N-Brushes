/**
 * Shared Onboarding Types
 * Used by both frontend and backend
 */

export type AccountType = 'solo' | 'salon';
export type RegionCode = 'NA' | 'EU' | 'GH' | 'NG';
export type PaymentProvider = 'stripe' | 'paystack';

// ============================================
// Request Types
// ============================================

export interface CreateAccountTypeRequest {
  accountType: AccountType;
}

export interface UpdateBusinessDetailsRequest {
  businessName: string;
  businessType?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  addressLine1?: string;
  addressLine2?: string;
  businessPhone?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  yearsExperience?: number;
  tagline?: string;
  description?: string;
}

export interface SaveProfileMediaRequest {
  profilePhotoUrl: string;
  logoUrl?: string;
  coverPhotoUrl?: string;
}

export interface UpdateBrandCustomizationRequest {
  brandColorPrimary?: string;
  brandColorSecondary?: string;
  brandColorAccent?: string;
  brandFontHeading?: string;
  brandFontBody?: string;
}

export interface GenerateAIPoliciesRequest {
  businessName: string;
  // Note: This is used to generate policy text only
  // Actual deposit config is per-service, not policy-level
}

export interface SavePoliciesRequest {
  cancellationPolicy: string;
  lateArrivalPolicy: string;
  depositRequired: boolean; // Whether deposits are required (general policy)
  refundPolicy: string;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  // Note: depositType and depositAmount are NOT here
  // They are configured per-service in CreateServiceRequest
}

export interface SetupPaymentRequest {
  regionCode: RegionCode;
  subscriptionTier: 'solo' | 'salon';
  paymentMethodId: string; // Stripe payment method ID or Paystack authorization code
}

export interface OnboardingDaySchedule {
  isAvailable: boolean;
  slots: {
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  }[];
}

export interface SetupAvailabilityRequest {
  timezone: string;
  schedule: {
    monday: OnboardingDaySchedule;
    tuesday: OnboardingDaySchedule;
    wednesday: OnboardingDaySchedule;
    thursday: OnboardingDaySchedule;
    friday: OnboardingDaySchedule;
    saturday: OnboardingDaySchedule;
    sunday: OnboardingDaySchedule;
  };
}

// ============================================
// Response Types
// ============================================

export interface OnboardingStep {
  step: string;
  label: string;
  completed: boolean;
}

export interface OnboardingStatusResponse {
  status: {
    hasProfile: boolean;
    completed: boolean;
    steps: {
      accountType: boolean;
      businessDetails: boolean;
      profileMedia: boolean;
      brandCustomization: boolean;
      policies: boolean;
      paymentSetup: boolean;
      availabilitySet: boolean;
    };
    profile?: {
      isSalon: boolean;
      businessName?: string | null;
      businessType?: string | null;
      description?: string | null;
      tagline?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      businessEmail?: string | null;
      businessPhone?: string | null;
      instagramHandle?: string | null;
      websiteUrl?: string | null;
      serviceSpecializations?: string[] | null;
      yearsExperience?: number | null;
      brandColorPrimary?: string | null;
      brandColorSecondary?: string | null;
      brandColorAccent?: string | null;
      brandFontHeading?: string | null;
      brandFontBody?: string | null;
      logoUrl?: string | null;
      coverPhotoUrl?: string | null;
      avatarUrl?: string | null;
      policies?: {
        cancellationPolicy?: string | null;
        lateArrivalPolicy?: string | null;
        depositRequired?: boolean | null;
        refundPolicy?: string | null;
        // Note: depositType and depositAmount are NOT policy-level fields
        // They are configured per-service in the Service model
      } | null;
      subscriptionTier?: string | null;
    };
  };
}

export interface CompleteOnboardingResponse {
  message: string;
  profile: {
    id: string;
    businessName: string;
    slug: string;
    isActive: boolean;
    trialEndDate: string;
  };
}

export interface CreateAccountTypeResponse {
  message: string;
  profile: {
    id: string;
    isSalon: boolean;
  };
}

export interface UpdateBusinessDetailsResponse {
  message: string;
  profile: {
    id: string;
    businessName: string;
    slug: string;
  };
}

export interface SaveProfileMediaResponse {
  message: string;
}

export interface UpdateBrandCustomizationResponse {
  message: string;
}

export interface GeneratedPolicies {
  cancellationPolicy: string;
  lateArrivalPolicy: string;
  depositPolicy: string;
  refundPolicy: string;
}

export interface GenerateAIPoliciesResponse {
  message: string;
  policies: GeneratedPolicies;
}

export interface SavePoliciesResponse {
  message: string;
}

export interface SetupPaymentResponse {
  message: string;
  paymentProvider: PaymentProvider;
  subscriptionStatus: string;
}

export interface SetupAvailabilityResponse {
  message: string;
  scheduleId: string;
}
