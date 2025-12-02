/**
 * Backend Payment Service Types
 *
 * Note: PaymentProvider and RegionCode are imported from shared-types
 * These types are backend-specific service layer types
 */

// Re-export shared payment types
export type { PaymentProvider, RegionCode } from '../../../shared-types/onboarding.types';

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
  emailToken?: string; // For Paystack - email token for subscription management (cancel/disable)
  paymentMethodId?: string;
  last4?: string;
  cardBrand?: string;
  trialEndDate: Date;
  nextBillingDate: Date;
  monthlyFee: number;
}
