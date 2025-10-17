/**
 * Webhook Event Types
 * Shared types for Stripe and Paystack webhook events
 */

// ============================================
// Paystack Webhook Types
// ============================================

export interface PaystackCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  risk_action: string;
}

export interface PaystackAuthorization {
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

export interface PaystackSubscriptionData {
  id: number;
  domain: string;
  status: string;
  subscription_code: string;
  email_token: string;
  amount: number;
  cron_expression: string;
  next_payment_date: string;
  open_invoice: string | null;
  integration: number;
  plan: {
    id: number;
    name: string;
    plan_code: string;
    description: string | null;
    amount: number;
    interval: string;
    send_invoices: boolean;
    send_sms: boolean;
    currency: string;
  };
  authorization: PaystackAuthorization;
  customer: PaystackCustomer;
  created_at: string;
  metadata?: {
    providerId?: string;
    [key: string]: unknown;
  };
}

export interface PaystackChargeData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata?: {
    providerId?: string;
    bookingId?: string;
    [key: string]: unknown;
  };
  log: {
    start_time: number;
    time_spent: number;
    attempts: number;
    errors: number;
    success: boolean;
    mobile: boolean;
    input: unknown[];
    history: Array<{
      type: string;
      message: string;
      time: number;
    }>;
  };
  fees: number;
  fees_split: unknown | null;
  authorization: PaystackAuthorization;
  customer: PaystackCustomer;
  plan: unknown | null;
  split: unknown;
  order_id: unknown | null;
  paidAt: string;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: unknown | null;
  source: unknown | null;
}

export interface PaystackWebhookEvent<T = unknown> {
  event: string;
  data: T;
}

// Specific event types
export type PaystackSubscriptionCreatedEvent = PaystackWebhookEvent<PaystackSubscriptionData>;
export type PaystackSubscriptionDisabledEvent = PaystackWebhookEvent<PaystackSubscriptionData>;
export type PaystackSubscriptionNotRenewEvent = PaystackWebhookEvent<PaystackSubscriptionData>;
export type PaystackChargeSuccessEvent = PaystackWebhookEvent<PaystackChargeData>;
export type PaystackChargeFailedEvent = PaystackWebhookEvent<PaystackChargeData>;

// ============================================
// Stripe Webhook Types (using Stripe SDK types)
// ============================================

// Note: Stripe types are already well-defined by the Stripe SDK
// We'll use Stripe.Event, Stripe.Subscription, Stripe.Invoice, etc.
// from the 'stripe' package directly in the webhook controller
