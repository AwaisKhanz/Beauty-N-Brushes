/**
 * Paystack Service
 * Handles Paystack subscription and customer management
 * Phase 3: Subscription Flow Implementation
 */

import { paymentConfig } from '../config/payment.config';
import { SUBSCRIPTION_TIERS, TRIAL_PERIOD_DAYS } from '../../../shared-constants';
import logger from '../utils/logger';

export interface SubscriptionResult {
  customerId: string;
  subscriptionId: string | null;
  emailToken: string | null;
  trialEndDate: Date | null;
  nextBillingDate: Date | null;
  monthlyFee: number;
}

/**
 * Get Paystack plan code based on tier and region
 */
function getPaystackPlanCode(tier: 'solo' | 'salon', regionCode: 'GH' | 'NG'): string {
  const plans = paymentConfig.paystack.plans;
  
  if (regionCode === 'GH') {
    return tier === 'solo' ? plans.soloGHS : plans.salonGHS;
  } else {
    return tier === 'solo' ? plans.soloNGN : plans.salonNGN;
  }
}

/**
 * Get subscription monthly fee in main currency (GHS/NGN)
 */
function getMonthlyFee(tier: 'solo' | 'salon', regionCode: 'GH' | 'NG'): number {
  const usdPrices = {
    solo: SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD,
    salon: SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD,
  };
  
  const rates = {
    GH: 12.5,  // 1 USD = 12.5 GHS
    NG: 1550,  // 1 USD = 1550 NGN
  };
  
  return usdPrices[tier] * rates[regionCode];
}

/**
 * Create or retrieve Paystack customer
 */
async function createOrGetCustomer(
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  try {
    // Try to create customer
    const response = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data: any = await response.json();

    if (response.ok) {
      return data.data.customer_code as string;
    }

    // If customer already exists, fetch it
    if (data.message?.includes('Customer already exists')) {
      const fetchResponse = await fetch(`https://api.paystack.co/customer/${email}`, {
        headers: {
          Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        },
      });

      const fetchData: any = await fetchResponse.json();
      return fetchData.data.customer_code as string;
    }

    throw new Error((data.message as string) || 'Failed to create customer');
  } catch (error) {
    logger.error('Error creating Paystack customer:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Create Paystack subscription
 */
async function createSubscription(params: {
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
    const error: any = await response.json();
    throw new Error((error.message as string) || 'Failed to create Paystack subscription');
  }

  const data: any = await response.json();
  return data.data as {
    subscription_code: string;
    email_token: string;
    amount: number;
    next_payment_date: string;
    status: string;
  };
}

/**
 * Create provider subscription
 * Main entry point for onboarding service
 */
export async function createProviderSubscription(
  email: string,
  firstName: string,
  lastName: string,
  tier: 'solo' | 'salon',
  regionCode: 'GH' | 'NG',
  _providerId: string,
  authorizationCode?: string
): Promise<SubscriptionResult> {
  try {
    logger.info(`Creating Paystack subscription for ${email}, tier: ${tier}, region: ${regionCode}`);

    // Create or get customer
    const customerCode = await createOrGetCustomer(email, firstName, lastName);
    logger.info(`Paystack customer created/retrieved: ${customerCode}`);

    // Get monthly fee
    const monthlyFee = getMonthlyFee(tier, regionCode);

    // If no authorization code, return trial mode
    if (!authorizationCode) {
      logger.info('No authorization code provided, setting up trial mode');
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS);

      return {
        customerId: customerCode,
        subscriptionId: null,
        emailToken: null,
        trialEndDate,
        nextBillingDate: null,
        monthlyFee,
      };
    }

    // Create subscription with authorization code
    const planCode = getPaystackPlanCode(tier, regionCode);
    logger.info(`Creating subscription with plan: ${planCode}`);

    const subscription = await createSubscription({
      customer: customerCode,
      plan: planCode,
      authorization: authorizationCode,
    });

    logger.info(`Paystack subscription created: ${subscription.subscription_code}`);

    // Convert amount from subunits to main currency
    const amountInMainCurrency = subscription.amount / 100;

    return {
      customerId: customerCode,
      subscriptionId: subscription.subscription_code,
      emailToken: subscription.email_token,
      trialEndDate: null,
      nextBillingDate: new Date(subscription.next_payment_date),
      monthlyFee: amountInMainCurrency,
    };
  } catch (error) {
    logger.error('Error creating Paystack subscription:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Disable Paystack subscription
 */
export async function disableSubscription(
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
    const error: any = await response.json();
    throw new Error((error.message as string) || 'Failed to disable subscription');
  }
}

/**
 * Enable Paystack subscription
 */
export async function enableSubscription(
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
    const error: any = await response.json();
    throw new Error((error.message as string) || 'Failed to enable subscription');
  }
}

export const paystackService = {
  createProviderSubscription,
  disableSubscription,
  enableSubscription,
};
