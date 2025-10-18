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
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trialEndDate: string | null;
  nextBillingDate: string | null;
  monthlyFee: number;
  currency: string;
  paymentProvider: 'stripe' | 'paystack';
  last4Digits: string | null;
  cardBrand: string | null;
  billingHistory: BillingRecord[];
}
