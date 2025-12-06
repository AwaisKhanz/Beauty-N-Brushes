/**
 * Platform Fee Utilities
 * Fetches and calculates platform service fees from backend
 */

interface PlatformFeeConfig {
  base: number;
  percentage: number;
  cap: number;
}

let cachedFeeConfig: PlatformFeeConfig | null = null;

/**
 * Fetch platform fee configuration from backend
 */
export async function fetchPlatformFeeConfig(): Promise<PlatformFeeConfig> {
  // Return cached config if available
  if (cachedFeeConfig) {
    return cachedFeeConfig;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/platform/fee-config`);
    if (!response.ok) {
      throw new Error('Failed to fetch platform fee config');
    }
    
    const data = await response.json();
    const config: PlatformFeeConfig = data.data;
    cachedFeeConfig = config;
    return config;
  } catch (error) {
    console.error('Error fetching platform fee config:', error);
    // Return default values as fallback
    const fallbackConfig: PlatformFeeConfig = {
      base: 1.25,
      percentage: 3.6,
      cap: 8.0,
    };
    return fallbackConfig;
  }
}

/**
 * Calculate platform fee for a given amount
 * @param amount - The booking amount
 * @param feeConfig - Optional fee config (will fetch if not provided)
 */
export async function calculatePlatformFee(
  amount: number,
  feeConfig?: PlatformFeeConfig
): Promise<number> {
  const config = feeConfig || await fetchPlatformFeeConfig();
  const calculated = config.base + (amount * config.percentage) / 100;
  return Math.min(calculated, config.cap);
}

/**
 * Clear cached fee config (useful after admin updates)
 */
export function clearPlatformFeeCache(): void {
  cachedFeeConfig = null;
}
