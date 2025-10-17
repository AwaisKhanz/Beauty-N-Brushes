/**
 * Payment Types
 */

export type PaymentProvider = 'stripe' | 'paystack';
export type RegionCode = 'NA' | 'EU' | 'GH' | 'NG';
export type SubscriptionTier = 'solo' | 'salon';

export interface RegionalServiceFee {
  base: number;
  percentage: number;
  cap: number;
  currency: string;
}

export interface SubscriptionResult {
  customerId: string;
  subscriptionId: string;
  planCode?: string; // For Paystack - plan code to use when creating subscription later
  paymentMethodId?: string;
  last4?: string;
  cardBrand?: string;
  trialEndDate: Date;
  nextBillingDate: Date;
  monthlyFee: number;
}
