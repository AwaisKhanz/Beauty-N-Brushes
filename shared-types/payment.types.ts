/**
 * Payment API Types
 *
 * Types for dual payment provider system (Stripe & Paystack) with regional routing.
 * Supports subscription billing and booking payments.
 *
 * @module shared-types/payment
 *
 * **Regional Payment Providers:**
 * - Stripe: North America (NA), Europe (EU)
 * - Paystack: Ghana (GH), Nigeria (NG)
 *
 * **Backend Usage:**
 * - `backend/src/controllers/payment.controller.ts`
 * - `backend/src/lib/stripe.ts`
 * - `backend/src/lib/payment.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.payment)
 * - `frontend/src/components/provider/StripeCardForm.tsx`
 * - `frontend/src/components/provider/PaystackCardForm.tsx`
 */

/**
 * Request to initialize a Paystack transaction for subscription payment
 * @interface
 */
export interface InitializePaystackRequest {
  email: string;
  amount: number;
  currency: string;
  subscriptionTier: 'solo' | 'salon';
  regionCode?: string; // Optional - backend determines from provider's business country
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

/**
 * Request to initialize a Paystack subscription (for provider onboarding)
 * @interface
 */
export interface InitializePaystackSubscriptionRequest {
  email: string;
  subscriptionTier: 'solo' | 'salon';
}

/**
 * Response from Paystack subscription initialization
 * @interface
 */
export interface InitializePaystackSubscriptionResponse {
  subscriptionCode: string;
  emailToken: string;
  authorizationUrl: string;
  nextPaymentDate: string;
  amount: number;
  status: string;
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
  paymentType?: 'deposit' | 'balance'; // NEW: Specify which payment to make
  // Phase 4: Payment channel selection
  paymentChannel?: 'card' | 'mobile_money' | 'bank_transfer';
  mobileMoneyProvider?: 'mtn' | 'vod' | 'atl';
  phoneNumber?: string;
}

export interface InitializeBookingPaymentResponse {
  // Stripe fields (NA/EU)
  clientSecret?: string;
  // Paystack fields (GH/NG)
  accessCode?: string; // ✅ For Popup JS (resumeTransaction)
  authorizationUrl?: string; // For redirect flow
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

// ================================
// Tip Payment Types
// ================================
