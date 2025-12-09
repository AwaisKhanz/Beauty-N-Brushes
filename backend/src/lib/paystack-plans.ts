/**
 * Paystack Plan Constants
 * 
 * Defines subscription plan codes for Paystack integration.
 * Plans must be created via Paystack Dashboard or API before use.
 * 
 * Pricing:
 * - Solo: $19 USD/month
 * - Salon: $49 USD/month
 * 
 * Plan codes are loaded from payment configuration
 */

import { paymentConfig } from '../config/payment.config';

export const PAYSTACK_PLANS = {
  // Ghana Plans (GHS)
  SOLO_GH: paymentConfig.paystack.plans.soloGHS,
  SALON_GH: paymentConfig.paystack.plans.salonGHS,
  
  // Nigeria Plans (NGN)
  SOLO_NG: paymentConfig.paystack.plans.soloNGN,
  SALON_NG: paymentConfig.paystack.plans.salonNGN,
} as const;

export type PaystackPlanCode = typeof PAYSTACK_PLANS[keyof typeof PAYSTACK_PLANS];

/**
 * Get Paystack plan code based on tier and region
 */
export function getPaystackPlanCode(
  tier: 'solo' | 'salon',
  regionCode: 'GH' | 'NG' | "NA"
): string {
  if (tier === 'solo') {
    return regionCode === 'NA' ? PAYSTACK_PLANS.SOLO_GH : PAYSTACK_PLANS.SOLO_NG;
  }
  return regionCode === 'NA' ? PAYSTACK_PLANS.SALON_GH : PAYSTACK_PLANS.SALON_NG;
}

/**
 * Plan creation helper (run once to create plans via API)
 * This should be run manually or via a setup script
 */
export async function createPaystackPlansViaAPI(secretKey: string) {
  const plans = [
    {
      name: 'Solo Professional - Ghana',
      interval: 'monthly',
      amount: 23750, // Will be updated with live rates
      currency: 'GHS',
      plan_code: PAYSTACK_PLANS.SOLO_GH,
    },
    {
      name: 'Salon & Team - Ghana',
      interval: 'monthly',
      amount: 61250, // Will be updated with live rates
      currency: 'GHS',
      plan_code: PAYSTACK_PLANS.SALON_GH,
    },
    {
      name: 'Solo Professional - Nigeria',
      interval: 'monthly',
      amount: 2945000, // Will be updated with live rates
      currency: 'NGN',
      plan_code: PAYSTACK_PLANS.SOLO_NG,
    },
    {
      name: 'Salon & Team - Nigeria',
      interval: 'monthly',
      amount: 7597500, // Will be updated with live rates
      currency: 'NGN',
      plan_code: PAYSTACK_PLANS.SALON_NG,
    },
  ];

  const results = [];
  
  for (const plan of plans) {
    const response = await fetch('https://api.paystack.co/plan', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    });
    
    const data = await response.json();
    results.push(data);
  }
  
  return results;
}
