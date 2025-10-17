/**
 * Regional constants
 * Shared between frontend and backend
 */

export const REGIONS = {
  NA: {
    code: 'NA' as const,
    name: 'North America',
    currency: 'USD',
    paymentProvider: 'stripe' as const,
  },
  EU: {
    code: 'EU' as const,
    name: 'Europe',
    currency: 'EUR',
    paymentProvider: 'stripe' as const,
  },
  GH: {
    code: 'GH' as const,
    name: 'Ghana',
    currency: 'GHS',
    paymentProvider: 'paystack' as const,
  },
  NG: {
    code: 'NG' as const,
    name: 'Nigeria',
    currency: 'NGN',
    paymentProvider: 'paystack' as const,
  },
} as const;

// Array format for dropdowns/iteration
export const REGIONS_ARRAY = [REGIONS.NA, REGIONS.EU, REGIONS.GH, REGIONS.NG] as const;

// Exchange rates (simplified - use actual API in production)
export const EXCHANGE_RATES = {
  GHS: 12.5, // 1 USD = ~12.5 GHS
  NGN: 1550, // 1 USD = ~1550 NGN
} as const;

// Helper types
export type RegionCode = keyof typeof REGIONS;
export type PaymentProvider = typeof REGIONS.NA.paymentProvider | typeof REGIONS.GH.paymentProvider;
