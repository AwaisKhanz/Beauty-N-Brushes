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

// African countries that use Paystack
export const PAYSTACK_COUNTRIES = ['GH', 'NG', 'ZA', 'KE', 'CI', 'SN', 'UG', 'RW', 'TZ', 'GN'] as const;

// Exchange rates (simplified - use actual API in production)
export const EXCHANGE_RATES = {
  GHS: 12.5, // 1 USD = ~12.5 GHS
  NGN: 1550, // 1 USD = ~1550 NGN
} as const;

// Helper types
export type RegionCode = keyof typeof REGIONS;
export type PaymentProvider = typeof REGIONS.NA.paymentProvider | typeof REGIONS.GH.paymentProvider;

/**
 * Get payment provider information based on country code
 * @param country - ISO country code (e.g., 'US', 'GH', 'NG')
 * @returns Payment provider, region, currency, and region name
 */
export function getPaymentInfoFromCountry(country: string): {
  provider: PaymentProvider;
  region: RegionCode;
  currency: string;
  regionName: string;
} {
  const countryCode = country.toUpperCase();

  if (countryCode === 'GH') {
    return {
      provider: REGIONS.GH.paymentProvider,
      region: REGIONS.GH.code,
      currency: REGIONS.GH.currency,
      regionName: REGIONS.GH.name,
    };
  } else if (countryCode === 'NG') {
    return {
      provider: REGIONS.NG.paymentProvider,
      region: REGIONS.NG.code,
      currency: REGIONS.NG.currency,
      regionName: REGIONS.NG.name,
    };
  } else if (PAYSTACK_COUNTRIES.includes(countryCode as any)) {
    // Other African countries use Paystack with GHS as default
    return {
      provider: REGIONS.GH.paymentProvider,
      region: REGIONS.GH.code,
      currency: REGIONS.GH.currency,
      regionName: 'Africa',
    };
  } else if (countryCode === 'US' || countryCode === 'CA') {
    return {
      provider: REGIONS.NA.paymentProvider,
      region: REGIONS.NA.code,
      currency: REGIONS.NA.currency,
      regionName: REGIONS.NA.name,
    };
  } else {
    // Default to Europe/Stripe for all other countries
    return {
      provider: REGIONS.EU.paymentProvider,
      region: REGIONS.EU.code,
      currency: REGIONS.EU.currency,
      regionName: REGIONS.EU.name,
    };
  }
}
