/**
 * Subscription-related constants
 * Shared between frontend and backend
 */

export const SUBSCRIPTION_TIERS = {
  SOLO: {
    key: 'solo' as const,
    name: 'Solo Professional',
    monthlyPriceUSD: 19.0,
    features: [
      'Personal profile',
      'Unlimited services',
      'Calendar management',
      'Basic analytics',
      'Client messaging',
      'Payment processing',
    ],
  },
  SALON: {
    key: 'salon' as const,
    name: 'Salon',
    monthlyPriceUSD: 49.0,
    features: [
      'Team management (up to 10)',
      'Multiple locations',
      'Advanced analytics',
      'Priority support',
    ],
  },
} as const;

export const TRIAL_PERIOD_DAYS = 60;

// Helper type for subscription tier keys
export type SubscriptionTierKey =
  | typeof SUBSCRIPTION_TIERS.SOLO.key
  | typeof SUBSCRIPTION_TIERS.SALON.key;

/**
 * Get subscription tier information by key
 * @param tierKey - 'solo' or 'salon'
 * @returns Subscription tier details
 */
export function getTierInfo(tierKey: SubscriptionTierKey) {
  return tierKey === 'solo' ? SUBSCRIPTION_TIERS.SOLO : SUBSCRIPTION_TIERS.SALON;
}
