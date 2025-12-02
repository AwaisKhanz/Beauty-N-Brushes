import Stripe from 'stripe';
import { paymentConfig } from '../config/payment.config';
import type {
  PaymentProvider,
  RegionCode,
  SubscriptionTier,
  SubscriptionResult,
} from '../types/payment.types';
import {
  REGIONS,
  REGIONAL_SERVICE_FEES,
  SUBSCRIPTION_TIERS,
  TRIAL_PERIOD_DAYS,
  EXCHANGE_RATES,
} from '../../../shared-constants';

// Re-export for convenience
export type { PaymentProvider, RegionCode, SubscriptionTier, SubscriptionResult };

/**
 * Generate idempotency key for payment operations
 * Prevents duplicate charges if client retries
 */
export function generateIdempotencyKey(bookingId: string, type: string): string {
  return `booking_${bookingId}_${type}`;
}

/**
 * Get payment provider based on region
 */
export function getPaymentProvider(regionCode: RegionCode): PaymentProvider {
  const region = REGIONS[regionCode];
  if (!region) {
    throw new Error(`Unsupported region: ${regionCode}`);
  }
  return region.paymentProvider;
}

/**
 * Calculate service fee charged to client
 */
export function calculateServiceFee(bookingAmount: number, regionCode: RegionCode): number {
  const feeStructure = REGIONAL_SERVICE_FEES[regionCode];
  if (!feeStructure) throw new Error(`Unknown region: ${regionCode}`);

  const calculated = feeStructure.base + (bookingAmount * feeStructure.percentage) / 100;
  return Math.min(calculated, feeStructure.cap);
}

/**
 * Get currency for region
 */
export function getRegionalCurrency(regionCode: RegionCode): string {
  return REGIONAL_SERVICE_FEES[regionCode].currency;
}

/**
 * Stripe Service for subscription management
 */
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const apiKey = paymentConfig.stripe.secretKey;
    if (!apiKey) {
      throw new Error('Stripe secret key not configured');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create provider subscription
   */
  async createProviderSubscription(
    email: string,
    firstName: string,
    lastName: string,
    paymentMethodId: string,
    tier: SubscriptionTier,
    providerId: string
  ): Promise<SubscriptionResult> {
    // Determine monthly fee from shared constants
    const monthlyFee =
      tier === 'solo'
        ? SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD
        : SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD;

    // Get price ID from payment config
    const priceId =
      tier === 'solo' ? paymentConfig.stripe.soloPriceId : paymentConfig.stripe.salonPriceId;

    if (!priceId) {
      throw new Error(`Stripe price ID not configured for ${tier} tier`);
    }

    // Attach payment method to customer first (required by Stripe)
    // First create customer
    const customer = await this.stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      metadata: {
        providerId,
        tier,
      },
    });

    // Attach payment method to customer
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await this.stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription with trial period from shared constants
    // Payment method is already attached and set as default, so subscription will charge after trial
    const subscription = await this.stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: TRIAL_PERIOD_DAYS,
        payment_behavior: 'default_incomplete', // Best practice: handle failed payments properly
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel', // Auto-cancel if no payment method at trial end
          },
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          providerId,
          tier,
        },
      },
      {
        idempotencyKey: `subscription_${providerId}_${tier}`, // Prevent duplicate subscriptions
      }
    );

    // Get payment method details
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    // Calculate trial end date from shared constants
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS);

    // Next billing date is same as trial end date
    const nextBillingDate = new Date(trialEndDate);

    return {
      customerId: customer.id,
      subscriptionId: subscription.id,
      paymentMethodId: paymentMethodId,
      last4: paymentMethod.card?.last4,
      cardBrand: paymentMethod.card?.brand,
      trialEndDate,
      nextBillingDate,
      monthlyFee,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }
}

/**
 * Paystack Service for subscription management
 */
export class PaystackService {
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = paymentConfig.paystack.secretKey;
    this.baseUrl = 'https://api.paystack.co';

    if (!this.secretKey) {
      console.warn('Paystack secret key not configured. Paystack integration will not work.');
    }
  }

  /**
   * Create provider subscription
   * This method now properly creates a Paystack subscription with authorization code
   */
  async createProviderSubscription(
    email: string,
    firstName: string,
    lastName: string,
    tier: SubscriptionTier,
    regionCode: RegionCode,
    providerId: string,
    authorizationCode?: string // Authorization code from payment transaction
  ): Promise<SubscriptionResult> {
    // Determine monthly fee in local currency from shared constants
    const baseMonthlyFee =
      tier === 'solo'
        ? SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD
        : SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD;
    const currency = getRegionalCurrency(regionCode);

    // Currency conversion using shared exchange rates
    const monthlyFee = Math.round(
      baseMonthlyFee * (EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1)
    );

    // Create or get customer
    let customerCode: string;
    const customerResponse = await fetch(`${this.baseUrl}/customer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        metadata: {
          providerId,
          tier,
        },
      }),
    });

    if (!customerResponse.ok) {
      const errorData = (await customerResponse.json()) as { message?: string };
      // Customer might already exist, try to fetch by email
      const existingCustomerResponse = await fetch(
        `${this.baseUrl}/customer?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (!existingCustomerResponse.ok) {
        throw new Error(errorData.message || 'Failed to create Paystack customer');
      }

      const existingCustomerData = (await existingCustomerResponse.json()) as {
        status: boolean;
        data?: Array<{ customer_code: string }>;
      };

      if (
        existingCustomerData.status &&
        existingCustomerData.data &&
        existingCustomerData.data.length > 0
      ) {
        customerCode = existingCustomerData.data[0].customer_code;
      } else {
        throw new Error(errorData.message || 'Failed to create Paystack customer');
      }
    } else {
      // Customer created successfully
      const customerData = (await customerResponse.json()) as {
        status: boolean;
        data?: { customer_code: string };
        message?: string;
      };

      if (customerData.status && customerData.data) {
        customerCode = customerData.data.customer_code;
      } else {
        throw new Error(customerData.message || 'Failed to create Paystack customer');
      }
    }

    // Use pre-created plan codes from payment config
    const planCode = regionCode === 'GH'
      ? (tier === 'solo' ? paymentConfig.paystack.plans.soloGHS : paymentConfig.paystack.plans.salonGHS)
      : (tier === 'solo' ? paymentConfig.paystack.plans.soloNGN : paymentConfig.paystack.plans.salonNGN);

    // Check if plan exists
    const planCheckResponse = await fetch(`${this.baseUrl}/plan/${planCode}`, {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    if (!planCheckResponse.ok) {
      // Plan doesn't exist, create it
      const planResponse = await fetch(`${this.baseUrl}/plan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Beauty N Brushes ${tier === 'solo' ? 'Solo' : 'Salon'} - ${currency}`,
          amount: monthlyFee * 100, // Convert to kobo/pesewas
          interval: 'monthly',
          currency,
          plan_code: planCode,
        }),
      });

      if (!planResponse.ok) {
        const errorData = (await planResponse.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to create Paystack plan');
      }

      // Verify plan was created successfully
      const planData = (await planResponse.json()) as {
        status: boolean;
        data?: { plan_code: string };
        message?: string;
      };

      if (!planData.status || !planData.data) {
        throw new Error(planData.message || 'Failed to create Paystack plan');
      }
    }

    // Calculate trial end date from shared constants
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS);

    // If authorization code is provided, create subscription immediately
    // Otherwise, return customer and plan info for later subscription creation
    let subscriptionCode = '';
    let emailToken = '';
    let nextBillingDate = trialEndDate;

    if (authorizationCode) {
      // Create subscription with authorization code
      const subscriptionResponse = await fetch(`${this.baseUrl}/subscription`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerCode,
          plan: planCode,
          authorization: authorizationCode,
          start_date: trialEndDate.toISOString(), // Start billing after trial
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorData = (await subscriptionResponse.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to create Paystack subscription');
      }

      const subscriptionData = (await subscriptionResponse.json()) as {
        status: boolean;
        data?: { 
          subscription_code: string; 
          next_payment_date: string;
          email_token: string; // Capture email token from response
        };
        message?: string;
      };

      if (subscriptionData.status && subscriptionData.data) {
        subscriptionCode = subscriptionData.data.subscription_code;
        emailToken = subscriptionData.data.email_token || ''; // Store email token
        nextBillingDate = new Date(subscriptionData.data.next_payment_date);
      } else {
        throw new Error(subscriptionData.message || 'Failed to create Paystack subscription');
      }
    }

    return {
      customerId: customerCode,
      subscriptionId: subscriptionCode,
      emailToken, // Return email token
      planCode,
      trialEndDate,
      nextBillingDate,
      monthlyFee,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/subscription/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: subscriptionCode,
        token: emailToken, // Use the stored email token
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string };
      throw new Error(errorData.message || 'Failed to cancel Paystack subscription');
    }
  }

  /**
   * Change subscription tier (Paystack)
   * Paystack doesn't support direct tier changes, so we cancel and recreate
   */
  async changeSubscriptionTier(
    subscriptionCode: string,
    emailToken: string,
    email: string,
    firstName: string,
    lastName: string,
    newTier: SubscriptionTier,
    regionCode: RegionCode,
    providerId: string,
    authorizationCode: string
  ): Promise<SubscriptionResult> {
    // Step 1: Cancel existing subscription
    await this.cancelSubscription(subscriptionCode, emailToken);

    // Step 2: Create new subscription with new tier
    const result = await this.createProviderSubscription(
      email,
      firstName,
      lastName,
      newTier,
      regionCode,
      providerId,
      authorizationCode
    );

    return result;
  }
}

export const stripeService = new StripeService();
export const paystackService = new PaystackService();
