/**
 * Currency Conversion Utilities for Paystack Integration
 * 
 * Paystack requires amounts in subunits (kobo for NGN, pesewas for GHS)
 * 1 NGN = 100 kobo
 * 1 GHS = 100 pesewas
 * 1 USD = 100 cents
 */

import { EXCHANGE_RATES, Currency } from './region.constants';

/**
 * Convert amount from one currency to another
 * @param amount - Amount in the source currency
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first (base currency)
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  
  // Then convert to target currency
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];
  
  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Convert amount to subunits (smallest currency unit)
 * Required by Paystack API
 * 
 * @param amount - Amount in main currency unit (e.g., 10.50 NGN)
 * @returns Amount in subunits (e.g., 1050 kobo)
 * 
 * @example
 * convertToSubunit(10.50) // Returns 1050 (kobo/pesewas)
 * convertToSubunit(5.25) // Returns 525 (pesewas)
 */
export function convertToSubunit(amount: number): number {
  // All supported currencies use 100 subunits per main unit
  return Math.round(amount * 100);
}

/**
 * Convert amount from subunits to main currency unit
 * 
 * @param amount - Amount in subunits (e.g., 1050 kobo)
 * @returns Amount in main currency unit (e.g., 10.50 NGN)
 * 
 * @example
 * convertFromSubunit(1050) // Returns 10.50
 * convertFromSubunit(525) // Returns 5.25
 */
export function convertFromSubunit(amount: number): number {
  return amount / 100;
}

/**
 * Get currency symbol for display
 * @param currency - Currency code
 * @returns Currency symbol
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
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string (e.g., "₦1,550.00")
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
 * Convert USD price to regional currency
 * Used for displaying prices in local currency
 * 
 * @param usdAmount - Amount in USD
 * @param targetCurrency - Target currency
 * @returns Amount in target currency
 * 
 * @example
 * convertUSDToRegional(19, 'GHS') // Returns 237.50 (Solo plan in GHS)
 * convertUSDToRegional(49, 'NGN') // Returns 75,950 (Salon plan in NGN)
 */
export function convertUSDToRegional(usdAmount: number, targetCurrency: Currency): number {
  return convertCurrency(usdAmount, 'USD', targetCurrency);
}
