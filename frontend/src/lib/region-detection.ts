import type { RegionCode } from '../../../shared-constants';
import { REGIONS } from '../../../shared-constants';

const REGION_STORAGE_KEY = 'user_region';
const REGION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface RegionData {
  regionCode: RegionCode;
  regionName: string;
  currency: string;
  paymentProvider: 'stripe' | 'paystack';
  detectedAt: number;
}

/**
 * Utility for detecting and caching user region
 * Automatically determines region from user profile, cache, or IP geolocation
 */
export class RegionDetection {
  /**
   * Get user's region (from cache, user profile, or auto-detect)
   * Priority: user.regionCode > localStorage cache > API detection > fallback to NA
   */
  static async getUserRegion(user?: { regionCode?: string } | null): Promise<RegionCode> {
    // 1. If user is logged in and has regionCode, use that (highest priority)
    if (user?.regionCode) {
      const regionCode = user.regionCode as RegionCode;
      this.cacheRegion(regionCode);
      return regionCode;
    }

    // 2. Check localStorage cache
    const cachedRegion = this.getCachedRegion();
    if (cachedRegion) {
      return cachedRegion;
    }

    // 3. Auto-detect from IP via backend API
    const detectedRegion = await this.detectRegion();
    return detectedRegion;
  }

  /**
   * Detect region from IP address via backend API
   * Calls /api/v1/region/detect (no auth required)
   */
  static async detectRegion(): Promise<RegionCode> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/region/detect`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to detect region');
      }

      const data = await response.json();

      console.log(data);
      
      if (data.success && data.data.regionCode) {
        this.cacheRegion(data.data.regionCode);
        return data.data.regionCode;
      }

      // Fallback if API doesn't return expected format
      return 'NA';
    } catch (error) {
      console.error('Failed to detect region:', error);
      // Default to NA if detection fails
      return 'NA';
    }
  }

  /**
   * Cache region in localStorage with timestamp
   */
  private static cacheRegion(regionCode: RegionCode): void {
    try {
      const region = REGIONS[regionCode];
      const regionData: RegionData = {
        regionCode,
        regionName: region.name,
        currency: region.currency,
        paymentProvider: region.paymentProvider,
        detectedAt: Date.now(),
      };

      localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(regionData));
    } catch (error) {
      // Silently fail if localStorage is not available
      console.warn('Failed to cache region:', error);
    }
  }

  /**
   * Get cached region if still valid (within 24 hours)
   */
  private static getCachedRegion(): RegionCode | null {
    try {
      const cached = localStorage.getItem(REGION_STORAGE_KEY);
      if (!cached) return null;

      const regionData: RegionData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - regionData.detectedAt < REGION_CACHE_DURATION) {
        return regionData.regionCode;
      }

      // Cache expired, remove it
      localStorage.removeItem(REGION_STORAGE_KEY);
      return null;
    } catch (error) {
      // If there's any error parsing cache, clear it
      localStorage.removeItem(REGION_STORAGE_KEY);
      return null;
    }
  }

  /**
   * Clear cached region (useful for testing or manual override)
   */
  static clearCache(): void {
    try {
      localStorage.removeItem(REGION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear region cache:', error);
    }
  }

  /**
   * Get region data by region code
   */
  static getRegionData(regionCode: RegionCode) {
    return REGIONS[regionCode];
  }

  /**
   * Get payment provider for a region
   */
  static getPaymentProvider(regionCode: RegionCode): 'stripe' | 'paystack' {
    return REGIONS[regionCode].paymentProvider;
  }

  /**
   * Get currency for a region
   */
  static getCurrency(regionCode: RegionCode): string {
    return REGIONS[regionCode].currency;
  }
}
