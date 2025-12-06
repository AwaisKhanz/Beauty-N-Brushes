/**
 * Paystack Subscription Utilities
 * Helper functions for managing Paystack subscriptions
 */

import { paymentConfig } from '../config/payment.config';

export type SubscriptionTier = 'solo' | 'salon';
export type PaystackRegion = 'GH' | 'NG';

/**
 * Get Paystack plan code based on tier and region
 * @param tier - Subscription tier (solo/salon)
 * @param regionCode - Region code (GH/NG)
 * @returns Paystack plan code
 */
export function getPaystackPlanCode(tier: SubscriptionTier, regionCode: PaystackRegion): string {
  const plans = paymentConfig.paystack.plans;
  
  if (regionCode === 'GH') {
    return tier === 'solo' ? plans.soloGHS : plans.salonGHS;
  } else {
    return tier === 'solo' ? plans.soloNGN : plans.salonNGN;
  }
}

/**
 * Get subscription amount in main currency (GHS/NGN)
 * @param tier - Subscription tier
 * @param regionCode - Region code
 * @returns Amount in main currency
 */
export function getSubscriptionAmount(tier: SubscriptionTier, regionCode: PaystackRegion): number {
  // Base USD prices
  const usdPrices = {
    solo: 19,
    salon: 49,
  };
  
  // Exchange rates
  const rates = {
    GH: 12.5,  // 1 USD = 12.5 GHS
    NG: 1550,  // 1 USD = 1550 NGN
  };
  
  const usdAmount = usdPrices[tier];
  const rate = rates[regionCode];
  
  return usdAmount * rate;
}

/**
 * Get subscription amount in subunits (pesewas/kobo)
 * Required for Paystack API
 * @param tier - Subscription tier
 * @param regionCode - Region code
 * @returns Amount in subunits
 */
export function getSubscriptionAmountInSubunits(tier: SubscriptionTier, regionCode: PaystackRegion): number {
  const amount = getSubscriptionAmount(tier, regionCode);
  return Math.round(amount * 100);
}

/**
 * Create Paystack subscription
 * @param customer - Paystack customer code
 * @param plan - Paystack plan code
 * @param authorization - Authorization code from first payment
 * @returns Subscription data
 */
export async function createPaystackSubscription(params: {
  customer: string;
  plan: string;
  authorization: string;
}): Promise<{
  subscription_code: string;
  email_token: string;
  amount: number;
  next_payment_date: string;
  status: string;
}> {
  const response = await fetch('https://api.paystack.co/subscription', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: params.customer,
      plan: params.plan,
      authorization: params.authorization,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to create Paystack subscription');
  }

  const data = await response.json() as { data: any };
  return data.data;
}

/**
 * Disable Paystack subscription
 * @param subscriptionCode - Subscription code
 * @param emailToken - Email token
 */
export async function disablePaystackSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<void> {
  const response = await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to disable Paystack subscription');
  }
}

/**
 * Enable Paystack subscription
 * @param subscriptionCode - Subscription code
 * @param emailToken - Email token
 */
export async function enablePaystackSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<void> {
  const response = await fetch('https://api.paystack.co/subscription/enable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to enable Paystack subscription');
  }
}

/**
 * Get Paystack subscription details
 * @param subscriptionCode - Subscription code or ID
 * @returns Subscription details
 */
export async function getPaystackSubscription(subscriptionCode: string): Promise<any> {
  const response = await fetch(`https://api.paystack.co/subscription/${subscriptionCode}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to fetch Paystack subscription');
  }

  const data = await response.json() as { data: any };
  return data.data;
}
