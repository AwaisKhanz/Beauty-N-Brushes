/**
 * Payment API types
 */

export interface InitializePaystackRequest {
  email: string;
  amount: number;
  currency: string;
  subscriptionTier: 'solo' | 'salon';
  regionCode: string;
}

export interface InitializePaystackResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaystackResponse {
  status: string;
  amount: number;
  currency: string;
  authorizationCode: string;
  customer: {
    email: string;
  };
}

export interface VerifyPaystackTransactionResponse {
  success: boolean;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
    };
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    metadata?: {
      providerId?: string;
      subscriptionTier?: string;
      [key: string]: unknown;
    };
  };
}

export interface PaystackCustomerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PaystackAuthorizationData {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
}

// ================================
// Booking Payment Types
// ================================

export interface InitializeBookingPaymentRequest {
  bookingId: string;
}

export interface InitializeBookingPaymentResponse {
  // Stripe fields (NA/EU)
  clientSecret?: string;
  // Paystack fields (GH/NG)
  authorizationUrl?: string;
  reference?: string;
  // Common
  paymentProvider: 'stripe' | 'paystack';
  amount: number;
  currency: string;
}

export interface ConfirmBookingPaymentRequest {
  bookingId: string;
  paymentIntentId?: string; // Stripe
  reference?: string; // Paystack
}
