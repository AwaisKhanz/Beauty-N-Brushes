/**
 * Currency Utilities for Frontend
 * Centralized currency conversion using backend API
 */

import type { Currency } from '../../../shared-constants/region.constants';

// Cache for exchange rates
let ratesCache: Record<Currency, number> | null = null;
let cacheExpiry: Date | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get current exchange rates from backend API
 */
export async function getExchangeRates(): Promise<Record<Currency, number>> {
  // Return cached rates if still valid
  if (ratesCache && cacheExpiry && new Date() < cacheExpiry) {
    return ratesCache;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/currency/rates`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    // Update cache
    ratesCache = data.data.rates;
    cacheExpiry = new Date(Date.now() + CACHE_TTL_MS);
    
    return ratesCache!; // Non-null assertion since we just set it
  } catch (error) {
    console.error('[Currency] Failed to fetch rates:', error);
    
    // Return cached rates if available, even if expired
    if (ratesCache) {
      console.warn('[Currency] Using stale cached rates');
      return ratesCache;
    }
    
    // Fallback to hardcoded rates
    console.warn('[Currency] Using fallback hardcoded rates');
    return {
      USD: 1,
      GHS: 12.5,
      NGN: 1550,
      EUR: 0.92,
    };
  }
}

/**
 * Convert amount from one currency to another
 * Uses backend API for accurate conversion with live rates
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/currency/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        from: fromCurrency,
        to: toCurrency,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert currency');
    }

    const data = await response.json();
    return data.data.converted.amount;
  } catch (error) {
    console.error('[Currency] Failed to convert via API, using local conversion:', error);
    
    // Fallback to local conversion using cached/fallback rates
    const rates = await getExchangeRates();
    const amountInUSD = amount / rates[fromCurrency];
    const convertedAmount = amountInUSD * rates[toCurrency];
    return Math.round(convertedAmount * 100) / 100;
  }
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    GHS: '₵',
    NGN: '₦',
    EUR: '€',
  };
  
  return symbols[currency] || currency;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formatted}`;
}

/**
 * Convert USD price to regional currency (convenience function)
 */
export async function convertUSDToRegional(
  usdAmount: number,
  targetCurrency: Currency
): Promise<number> {
  return convertCurrency(usdAmount, 'USD', targetCurrency);
}

/**
 * Clear the rates cache (useful for testing or forcing refresh)
 */
export function clearRatesCache(): void {
  ratesCache = null;
  cacheExpiry = null;
}
