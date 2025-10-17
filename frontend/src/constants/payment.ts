/**
 * Payment and regional constants
 * Re-exported from shared-constants for convenience
 */

import { REGIONS_ARRAY } from '../../../shared-constants';

export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  PAYSTACK: 'paystack',
} as const;

// Re-export shared constants
export {
  REGIONAL_SERVICE_FEES,
  SUBSCRIPTION_TIERS,
  TRIAL_PERIOD_DAYS,
  EXCHANGE_RATES,
} from '../../../shared-constants';

// For backward compatibility, export REGIONS as array (previously was array format)
export const REGIONS = REGIONS_ARRAY;
