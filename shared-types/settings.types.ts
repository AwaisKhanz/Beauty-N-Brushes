/**
 * Settings Types
 * Types for provider settings management
 */

// ================================
// Profile/Business Settings
// ================================

export interface UpdateProfileSettingsRequest {
  businessName?: string;
  tagline?: string | null;
  description?: string | null;
  yearsExperience?: number;
  websiteUrl?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  facebookUrl?: string | null;
  profilePhotoUrl?: string | null;
  coverPhotoUrl?: string | null;
  // Business Details
  businessType?: string | null;
  timezone?: string | null;
}

// ================================
// Booking Settings
// ================================

export interface UpdateBookingSettingsRequest {
  instantBookingEnabled?: boolean;
  acceptsNewClients?: boolean;
  mobileServiceAvailable?: boolean;
  advanceBookingDays?: number;
  minAdvanceHours?: number;
  bookingBufferMinutes?: number;
  sameDayBookingEnabled?: boolean;
  parkingAvailable?: boolean | null;
  wheelchairAccessible?: boolean | null;
}

// ================================
// Policies
// ================================

export interface UpdatePoliciesRequest {
  cancellationWindowHours?: number;
  cancellationFeePercentage?: number;
  cancellationPolicyText?: string | null;
  lateGracePeriodMinutes?: number;
  lateCancellationAfterMinutes?: number;
  latePolicyText?: string | null;
  noShowFeePercentage?: number;
  noShowPolicyText?: string | null;
  rescheduleAllowed?: boolean;
  rescheduleWindowHours?: number;
  maxReschedules?: number;
  reschedulePolicyText?: string | null;
  refundPolicyText?: string | null;
  consultationRequired?: boolean;
  requiresClientProducts?: boolean;
  touchUpPolicyText?: string | null;
}

// ================================
// Notification Settings
// ================================

export interface UpdateNotificationSettingsRequest {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface NotificationSettingsResponse {
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// ================================
// Account Settings
// ================================

export interface UpdateAccountRequest {
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

// ================================
// Payment Method Update
// ================================

export interface UpdatePaymentMethodRequest {
  paymentMethodId: string; // Stripe PaymentMethod ID or Paystack authorization code
  region: 'NA' | 'EU' | 'GH' | 'NG';
}

// ================================
// Response Types
// ================================

export interface ProviderSettingsProfile {
  id: string;
  businessName: string;
  tagline: string | null;
  description: string | null;
  yearsExperience: number | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  facebookUrl: string | null;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  instantBookingEnabled: boolean;
  acceptsNewClients: boolean;
  mobileServiceAvailable: boolean;
  advanceBookingDays: number;
  minAdvanceHours: number;
  bookingBufferMinutes: number;
  sameDayBookingEnabled: boolean;
  parkingAvailable: boolean | null;
  wheelchairAccessible: boolean | null;
  regionCode: string;
  currency: string;
  // Business Details
  businessType: string | null;
  timezone: string;
}

export interface ProviderSettingsResponse {
  message: string;
  profile: ProviderSettingsProfile;
}

export interface ProviderPoliciesResponse {
  message: string;
  policies: {
    id: string;
    cancellationWindowHours: number;
    cancellationFeePercentage: number;
    cancellationPolicyText: string | null;
    lateGracePeriodMinutes: number;
    lateCancellationAfterMinutes: number;
    latePolicyText: string | null;
    noShowFeePercentage: number;
    noShowPolicyText: string | null;
    rescheduleAllowed: boolean;
    rescheduleWindowHours: number;
    maxReschedules: number;
    reschedulePolicyText: string | null;
    refundPolicyText: string | null;
    consultationRequired: boolean;
    requiresClientProducts: boolean;
    touchUpPolicyText: string | null;
  };
}

export interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl?: string;
}

export interface SubscriptionInfoResponse {
  subscriptionTier: 'solo' | 'salon';
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'paused';
  trialEndDate: string | null;
  nextBillingDate: string | null;
  monthlyFee: number;
  currency: string;
  paymentProvider: 'stripe' | 'paystack';
  last4Digits: string | null;
  cardBrand: string | null;
  billingHistory: BillingRecord[];
}

// ================================
// Branding Settings
// ================================

export interface UpdateBrandingRequest {
  logoUrl?: string | null;
  brandColorPrimary?: string | null;
  brandColorSecondary?: string | null;
  brandColorAccent?: string | null;
  brandFontHeading?: string | null;
  brandFontBody?: string | null;
}

export interface BrandingSettingsResponse {
  message: string;
  branding: {
    logoUrl: string | null;
    brandColorPrimary: string | null;
    brandColorSecondary: string | null;
    brandColorAccent: string | null;
    brandFontHeading: string | null;
    brandFontBody: string | null;
  };
}

export interface GenerateBrandThemeRequest {
  description: string; // Natural language description of brand vibe
}

export interface GenerateBrandThemeResponse {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  vibe: string;
}

// ================================
// Location Settings
// ================================

export interface UpdateLocationRequest {
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  businessPhone?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationSettingsResponse {
  message: string;
  location: {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    businessPhone: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

// ================================
// Google Calendar Integration
// ================================

export interface GoogleCalendarConnectionResponse {
  connected: boolean;
  email: string | null;
  lastSyncAt: string | null;
}

export interface GoogleCalendarConnectResponse {
  authUrl: string;
}

export interface GoogleCalendarDisconnectResponse {
  message: string;
}

// ================================
// Business Details (Settings)
// ================================

export interface UpdateBusinessDetailsSettingsRequest {
  businessPhone?: string;
  businessType?: string;
  licenseNumber?: string | null;
  timezone?: string;
}

export interface BusinessDetailsResponse {
  message: string;
  details: {
    businessPhone: string | null;
    businessType: string | null;
    licenseNumber: string | null;
    licenseVerified: boolean;
    insuranceVerified: boolean;
    timezone: string;
  };
}

// ================================
// Subscription Management
// ================================

export interface ChangeTierRequest {
  newTier: 'solo' | 'salon';
}

export interface ChangeTierResponse {
  message: string;
  newTier: 'solo' | 'salon';
  newMonthlyFee: number;
  effectiveDate: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
}

export interface CancelSubscriptionResponse {
  message: string;
  cancelledAt: string;
  accessUntil: string;
}
