/**
 * Exchange Rate Service
 * Fetches real-time currency exchange rates from exchangerate.host API
 * Implements caching and fallback mechanisms for reliability
 */

import { EXCHANGE_RATES, type Currency } from '../../../shared-constants/region.constants';

// Cache configuration
const CACHE_TTL_MINUTES = parseInt(process.env.EXCHANGE_RATE_CACHE_TTL_MINUTES || '60', 10);
const API_URL = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate.host/latest';

interface ExchangeRateCache {
  rates: Record<Currency, number>;
  lastUpdated: Date;
  expiresAt: Date;
}

interface ExchangeRateAPIResponse {
  success: boolean;
  base: string;
  date: string;
  rates: Record<string, number>;
}

class ExchangeRateService {
  private cache: ExchangeRateCache | null = null;
  private isFetching = false;
  private fetchPromise: Promise<Record<Currency, number>> | null = null;

  /**
   * Get current exchange rates (from cache or API)
   */
  async getExchangeRates(): Promise<Record<Currency, number>> {
    // Return cached rates if still valid
    if (this.cache && new Date() < this.cache.expiresAt) {
      console.log('[ExchangeRate] Using cached rates');
      return this.cache.rates;
    }

    // If already fetching, wait for that request
    if (this.isFetching && this.fetchPromise) {
      console.log('[ExchangeRate] Waiting for ongoing fetch');
      return this.fetchPromise;
    }

    // Fetch fresh rates
    this.isFetching = true;
    this.fetchPromise = this.fetchRatesFromAPI();

    try {
      const rates = await this.fetchPromise;
      return rates;
    } finally {
      this.isFetching = false;
      this.fetchPromise = null;
    }
  }

  /**
   * Fetch rates from exchangerate.host API
   */
  private async fetchRatesFromAPI(): Promise<Record<Currency, number>> {
    try {
      console.log('[ExchangeRate] Fetching fresh rates from API');
      
      // Fetch rates with USD as base currency
      const response = await fetch(`${API_URL}?base=USD&symbols=GHS,NGN,EUR`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = (await response.json()) as ExchangeRateAPIResponse;

      if (!data.success || !data.rates) {
        throw new Error('Invalid API response format');
      }

      // Build rates object with USD as base (1.0)
      const rates: Record<Currency, number> = {
        USD: 1,
        GHS: data.rates.GHS || EXCHANGE_RATES.GHS,
        NGN: data.rates.NGN || EXCHANGE_RATES.NGN,
        EUR: data.rates.EUR || EXCHANGE_RATES.EUR,
      };

      // Update cache
      const now = new Date();
      this.cache = {
        rates,
        lastUpdated: now,
        expiresAt: new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000),
      };

      console.log('[ExchangeRate] Successfully fetched and cached rates:', rates);
      return rates;
    } catch (error) {
      console.error('[ExchangeRate] Failed to fetch rates from API:', error);
      
      // Use stale cache if available
      if (this.cache) {
        console.warn('[ExchangeRate] Using stale cached rates due to API failure');
        return this.cache.rates;
      }

      // Fall back to hardcoded rates
      console.warn('[ExchangeRate] Falling back to hardcoded rates');
      return EXCHANGE_RATES;
    }
  }

  /**
   * Convert amount from one currency to another using live rates
   */
  async convertCurrency(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();

    // Convert to USD first (base currency)
    const amountInUSD = amount / rates[fromCurrency];

    // Then convert to target currency
    const convertedAmount = amountInUSD * rates[toCurrency];

    // Round to 2 decimal places
    return Math.round(convertedAmount * 100) / 100;
  }

  /**
   * Force refresh rates from API (bypass cache)
   */
  async refreshRates(): Promise<Record<Currency, number>> {
    console.log('[ExchangeRate] Force refreshing rates');
    this.cache = null; // Invalidate cache
    return this.getExchangeRates();
  }

  /**
   * Get cache status for monitoring
   */
  getCacheStatus(): {
    isCached: boolean;
    lastUpdated: Date | null;
    expiresAt: Date | null;
    isExpired: boolean;
  } {
    if (!this.cache) {
      return {
        isCached: false,
        lastUpdated: null,
        expiresAt: null,
        isExpired: true,
      };
    }

    return {
      isCached: true,
      lastUpdated: this.cache.lastUpdated,
      expiresAt: this.cache.expiresAt,
      isExpired: new Date() >= this.cache.expiresAt,
    };
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();
