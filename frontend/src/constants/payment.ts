/**
 * Payment and regional constants
 */

export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  PAYSTACK: 'paystack',
} as const;

export const REGIONS = [
  { code: 'NA', name: 'North America', currency: 'USD', provider: 'stripe' },
  { code: 'EU', name: 'Europe', currency: 'EUR', provider: 'stripe' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', provider: 'paystack' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', provider: 'paystack' },
] as const;

export const SUBSCRIPTION_TIERS = {
  SOLO: {
    name: 'Solo Professional',
    price: 19.0,
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
    name: 'Salon',
    price: 49.0,
    features: [
      'Team management (up to 10)',
      'Multiple locations',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access',
    ],
  },
} as const;

export const TRIAL_PERIOD_DAYS = 60;
