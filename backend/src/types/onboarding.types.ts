/**
 * Onboarding Types
 */

export interface AccountTypeData {
  accountType: 'solo' | 'salon';
  userId: string;
}

export interface BusinessDetailsData {
  businessName: string;
  tagline?: string;
  businessType?: string;
  description?: string;
  // Google Places fields
  placeId?: string;
  formattedAddress?: string;
  addressComponents?: Record<string, unknown>;
  // Standard address fields
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  businessEmail?: string;
  instagramHandle?: string;
  website?: string;
  serviceSpecializations: string[];
  yearsExperience?: number;

  // Salon specific
  additionalLocations?: Array<{
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }>;
}

export interface BrandCustomizationData {
  brandColorPrimary?: string;
  brandColorSecondary?: string;
  brandColorAccent?: string;
  brandFontHeading?: string;
  brandFontBody?: string;
}

export interface PolicyData {
  cancellationPolicy: string;
  lateArrivalPolicy: string;
  depositRequired: boolean; // General policy: whether deposits are required
  refundPolicy: string;
  // Note: depositType and depositAmount are NOT policy-level
  // They are configured per-service in the Service model
}

export interface AvailabilityScheduleData {
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  timezone: string;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferMinutes: number;
  sameDayBooking: boolean;
}

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
    policies?: PolicyData | null;
    subscriptionTier?: string | null;
  };
}
