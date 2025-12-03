/**
 * Subscription Configuration Types
 * Shared between frontend and backend
 */

/**
 * Subscription configuration response
 */
export interface SubscriptionConfigResponse {
  id: string;
  trialEnabled: boolean;
  trialDurationDays: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update subscription configuration request
 */
export interface UpdateSubscriptionConfigRequest {
  trialEnabled?: boolean;
  trialDurationDays?: number;
}

/**
 * Validation constants for subscription config
 */
export const SUBSCRIPTION_CONFIG_VALIDATION = {
  MIN_TRIAL_DAYS: 1,
  MAX_TRIAL_DAYS: 365,
} as const;
