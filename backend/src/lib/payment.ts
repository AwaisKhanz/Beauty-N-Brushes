import Stripe from 'stripe';
import type {
  PaymentProvider,
  RegionCode,
  SubscriptionTier,
  RegionalServiceFee,
  SubscriptionResult,
} from '../types/payment.types';

// Re-export for convenience
export type { PaymentProvider, RegionCode, SubscriptionTier, SubscriptionResult };

/**
 * Get payment provider based on region
 */
export function getPaymentProvider(regionCode: RegionCode): PaymentProvider {
  const stripeRegions: RegionCode[] = ['NA', 'EU'];
  const paystackRegions: RegionCode[] = ['GH', 'NG'];

  if (stripeRegions.includes(regionCode)) return 'stripe';
  if (paystackRegions.includes(regionCode)) return 'paystack';

  throw new Error(`Unsupported region: ${regionCode}`);
}

/**
 * Regional service fee structure
 */
const REGIONAL_SERVICE_FEES: Record<RegionCode, RegionalServiceFee> = {
  NA: { base: 1.25, percentage: 3.6, cap: 8.0, currency: 'USD' },
  EU: { base: 1.25, percentage: 3.6, cap: 8.0, currency: 'USD' },
  GH: { base: 10, percentage: 2.9, cap: 60, currency: 'GHS' },
  NG: { base: 1500, percentage: 2.9, cap: 6224, currency: 'NGN' },
};

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
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
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
    // Determine monthly fee
    const monthlyFee = tier === 'solo' ? 19.0 : 49.0;

    // Get price ID from environment
    const priceId =
      tier === 'solo' ? process.env.STRIPE_SOLO_PRICE_ID : process.env.STRIPE_SALON_PRICE_ID;

    if (!priceId) {
      throw new Error(`Stripe price ID not configured for ${tier} tier`);
    }

    // Create customer
    const customer = await this.stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        providerId,
        tier,
      },
    });

    // Create subscription with 2-month trial (60 days)
    // TESTING: Trial commented out for payment testing
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 60,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        providerId,
        tier,
      },
    });

    // Get payment method details
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    // Calculate trial end date (60 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 60);

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
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.baseUrl = 'https://api.paystack.co';

    if (!this.secretKey) {
      console.warn('PAYSTACK_SECRET_KEY not configured. Paystack integration will not work.');
    }
  }

  /**
   * Create provider subscription
   */
  async createProviderSubscription(
    email: string,
    firstName: string,
    lastName: string,
    tier: SubscriptionTier,
    regionCode: RegionCode,
    providerId: string
  ): Promise<SubscriptionResult> {
    // Determine monthly fee in local currency
    const baseMonthlyFee = tier === 'solo' ? 19.0 : 49.0;
    const currency = getRegionalCurrency(regionCode);

    // Currency conversion (simplified - use actual exchange rates in production)
    const exchangeRates: Record<string, number> = {
      GHS: 12.5, // 1 USD = ~12.5 GHS
      NGN: 1550, // 1 USD = ~1550 NGN
    };

    const monthlyFee = Math.round(baseMonthlyFee * (exchangeRates[currency] || 1));

    // Create customer
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
      throw new Error('Failed to create Paystack customer');
    }

    const customerData = (await customerResponse.json()) as {
      data: { customer_code: string };
    };

    // Create subscription plan
    const planCode = `bnb_${tier}_${currency.toLowerCase()}`;
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

    // Plan might already exist, which is okay
    const planData = planResponse.ok
      ? ((await planResponse.json()) as { data: { plan_code: string } })
      : { data: { plan_code: planCode } };

    // Calculate trial end date (60 days from now)
    // TESTING: Trial commented out for payment testing
    // const trialEndDate = new Date();
    // trialEndDate.setDate(trialEndDate.getDate() + 60);
    const trialEndDate = new Date(); // TESTING: Set to now for immediate billing

    // For Paystack trial without payment method, we don't create subscription yet
    // Instead, we'll create it when they add payment method (via payment link)
    // For now, just return the customer and plan info

    // TESTING NOTE: To test Paystack payments immediately:
    // 1. Collect payment method via Paystack inline/popup first
    // 2. Get the authorization code from the transaction
    // 3. Create subscription with: customer, plan, and start_date (set to now)
    // For now, this returns empty subscription (trial mode)

    // Store the plan code in customer metadata for later subscription creation
    return {
      customerId: customerData.data.customer_code,
      subscriptionId: '', // Will be created when payment method is added
      planCode: planData.data.plan_code, // Store plan for later
      trialEndDate,
      // nextBillingDate: trialEndDate,
      nextBillingDate: new Date(), // TESTING: Immediate billing
      monthlyFee,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionCode: string): Promise<void> {
    await fetch(`${this.baseUrl}/subscription/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: subscriptionCode,
        token: subscriptionCode,
      }),
    });
  }
}

export const stripeService = new StripeService();
export const paystackService = new PaystackService();
