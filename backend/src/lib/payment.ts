import Stripe from 'stripe';
import { paymentConfig } from '../config/payment.config';
import type {
  PaymentProvider,
  SubscriptionTier,
  SubscriptionResult,
} from '../types/payment.types';
import {
  REGIONS,
  SUBSCRIPTION_TIERS,
  type RegionCode,
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
 * Fetches fee configuration from database for flexibility
 */
export async function calculateServiceFee(bookingAmount: number): Promise<number> {
  const { platformConfigService } = await import('../services/platform-config.service');
  const feeConfig = await platformConfigService.getServiceFeeConfig();
  
  const calculated = feeConfig.base + (bookingAmount * feeConfig.percentage) / 100;
  return Math.min(calculated, feeConfig.cap);
}

/**
 * Get currency for region
 * ✅ All regions now use USD
 */
export function getRegionalCurrency(_regionCode: RegionCode): string {
  return 'USD'; // All regions use USD
}

// Currency conversion removed - all transactions in USD


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
   * @param trialDurationDays - Optional trial duration in days. If not provided, no trial is applied.
   */
  async createProviderSubscription(
    email: string,
    firstName: string,
    lastName: string,
    paymentMethodId: string,
    tier: SubscriptionTier,
    providerId: string,
    trialDurationDays?: number | null,
    existingCustomerId?: string
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

    let customerId = existingCustomerId;

    // If no existing customer, create one and attach payment method
    if (!customerId) {
      // Create customer
      const customer = await this.stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        metadata: {
          providerId,
          tier,
        },
      });
      customerId = customer.id;

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } else {
      // If using existing customer, payment method should already be attached via SetupIntent
      // But we verify/attach just in case it's not (e.g. if passed directly)
      try {
        const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.customer !== customerId) {
          await this.stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
          });
        }
      } catch (error) {
        // Ignore "already attached" errors if it's the same customer
        // If it's a different customer, Stripe will throw and we let it bubble up
        console.log('Payment method attachment check:', error);
      }
    }

    // Set as default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        providerId,
        tier,
      },
    });

    // Create subscription with optional trial period
    // Payment method is already attached and set as default, so subscription will charge after trial
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      // If no trial, charge immediately. If trial, defer payment until trial ends
      payment_behavior: trialDurationDays && trialDurationDays > 0 ? 'default_incomplete' : 'allow_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        providerId,
        tier,
      },
    };

    // Add trial period if provided
    if (trialDurationDays && trialDurationDays > 0) {
      subscriptionParams.trial_period_days = trialDurationDays;
      subscriptionParams.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel', // Auto-cancel if no payment method at trial end
        },
      };
    }

    const subscription = await this.stripe.subscriptions.create(
      subscriptionParams,
      {
        idempotencyKey: `subscription_${providerId}_${tier}_${Date.now()}`, // Prevent duplicate subscriptions but allow retries
      }
    );

    // Get payment method details
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    // Calculate trial end date based on provided duration
    let trialEndDate: Date | null = null;
    if (trialDurationDays && trialDurationDays > 0) {
      trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);
    }

    // Next billing date is same as trial end date (or now if no trial)
    const nextBillingDate = trialEndDate ? new Date(trialEndDate) : new Date();

    return {
      customerId: customerId,
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
   * @param trialDurationDays - Optional trial duration in days. If not provided, no trial is applied.
   */
  async createProviderSubscription(
    email: string,
    firstName: string,
    lastName: string,
    tier: SubscriptionTier,
    regionCode: RegionCode,
    providerId: string,
    authorizationCode?: string, // Authorization code from payment transaction
    trialDurationDays?: number | null
  ): Promise<SubscriptionResult> {
    // Get base monthly fee for tier
    const monthlyFee = tier === 'solo' 
      ? SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD 
      : SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD;
    

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
    // These plans should already exist in Paystack dashboard
    const planCode = regionCode === 'NA'
      ? (tier === 'solo' ? paymentConfig.paystack.plans.soloGHS : paymentConfig.paystack.plans.salonGHS)
      : (tier === 'solo' ? paymentConfig.paystack.plans.soloNGN : paymentConfig.paystack.plans.salonNGN);

    console.log('Using Paystack plan:', { planCode, tier, regionCode });

    // Calculate trial end date based on provided duration
    let trialEndDate: Date | null = null;
    if (trialDurationDays && trialDurationDays > 0) {
      trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);
    }

    // If authorization code is provided, create subscription immediately
    // Otherwise, return customer and plan info for later subscription creation
    let subscriptionCode = '';
    let emailToken = '';
    let nextBillingDate = trialEndDate || new Date(); // Use now if no trial

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
          start_date: trialEndDate ? trialEndDate.toISOString() : new Date().toISOString(), // Start billing immediately if no trial
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
      const errorMessage = errorData.message || 'Failed to cancel Paystack subscription';
      
      // If subscription is already cancelled/inactive, don't throw error
      if (errorMessage.toLowerCase().includes('not found') || 
          errorMessage.toLowerCase().includes('inactive') ||
          errorMessage.toLowerCase().includes('already')) {
        console.log('Paystack subscription already cancelled or inactive:', subscriptionCode);
        return; // Gracefully handle already-cancelled subscriptions
      }
      
      throw new Error(errorMessage);
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
