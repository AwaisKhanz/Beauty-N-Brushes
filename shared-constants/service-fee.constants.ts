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
    base: 10,
    percentage: 2.9,
    cap: 60,
    currency: 'GHS',
  },
  NG: {
    base: 1500,
    percentage: 2.9,
    cap: 6224,
    currency: 'NGN',
  },
} as const;
