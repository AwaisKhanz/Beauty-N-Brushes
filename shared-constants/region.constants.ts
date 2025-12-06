/**
 * Regional constants
 * Shared between frontend and backend
 */

export const REGIONS = {
  NA: {
    code: 'NA' as const,
    name: 'North America',
    currency: 'USD',
    paymentProvider: 'stripe' as const, // ✅ NA uses Stripe for USD
  },
  EU: {
    code: 'EU' as const,
    name: 'Europe',
    currency: 'USD',
    paymentProvider: 'stripe' as const, // ✅ EU uses Stripe for USD
  },
  GH: {
    code: 'GH' as const,
    name: 'Ghana',
    currency: 'GHS', // ✅ Ghana uses Ghanaian Cedi
    paymentProvider: 'paystack' as const, // ✅ GH uses Paystack
  },
  NG: {
    code: 'NG' as const,
    name: 'Nigeria',
    currency: 'NGN', // ✅ Nigeria uses Nigerian Naira
    paymentProvider: 'paystack' as const, // ✅ NG uses Paystack
  },
} as const;


// Array format for dropdowns/iteration
export const REGIONS_ARRAY = [REGIONS.NA, REGIONS.EU, REGIONS.GH, REGIONS.NG] as const;

// African countries that use Paystack
export const PAYSTACK_COUNTRIES = ['GH', 'NG', 'ZA', 'KE', 'CI', 'SN', 'UG', 'RW', 'TZ', 'GN'] as const;

/**
 * Exchange rates for currency conversion
 * Base currency: USD
 * Updated: 2024-12-05
 */
export const EXCHANGE_RATES = {
  USD: 1,
  GHS: 12.5,  // 1 USD = 12.5 GHS (Ghanaian Cedi)
  NGN: 1550,  // 1 USD = 1550 NGN (Nigerian Naira)
  EUR: 0.92,  // 1 USD = 0.92 EUR (for reference)
} as const;

export type Currency = keyof typeof EXCHANGE_RATES;

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
