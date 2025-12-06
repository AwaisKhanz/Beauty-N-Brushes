/**
 * Regional service fee structures
 * Shared between frontend and backend
 */

import type { RegionCode } from './region.constants';

export interface RegionalServiceFee {
  base: number;
  percentage: number;
  cap: number;
  currency: string;
}

export const REGIONAL_SERVICE_FEES: Record<RegionCode, RegionalServiceFee> = {
  NA: {
    base: 1.25,
    percentage: 3.6,
    cap: 8.0,
    currency: 'USD',
  },
  EU: {
    base: 1.25,
    percentage: 3.6,
    cap: 8.0,
    currency: 'USD',
  },
  GH: {
    base: 1.25, // Changed from 10 GHS to USD equivalent
    percentage: 3.6,
    cap: 8.0, // Changed from 60 GHS to USD equivalent
    currency: 'USD', // Changed from GHS to USD
  },
  NG: {
    base: 1.25, // Changed from 1500 NGN to USD equivalent
    percentage: 3.6,
    cap: 8.0, // Changed from 6224 NGN to USD equivalent
    currency: 'USD', // Changed from NGN to USD
  },
} as const;
