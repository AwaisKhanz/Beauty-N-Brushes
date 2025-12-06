/**
 * Platform Fee Constants
 * Default values - actual values come from database
 * These are fallbacks for frontend calculations
 */

export const DEFAULT_PLATFORM_FEE = {
  base: 1.25,
  percentage: 3.6,
  cap: 8.0,
} as const;

/**
 * Calculate platform fee
 * Uses default constants (matches database defaults)
 */
export function calculatePlatformFee(amount: number): number {
  const calculated = DEFAULT_PLATFORM_FEE.base + (amount * DEFAULT_PLATFORM_FEE.percentage) / 100;
  return Math.min(calculated, DEFAULT_PLATFORM_FEE.cap);
}
