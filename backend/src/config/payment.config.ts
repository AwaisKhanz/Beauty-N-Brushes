/**
 * Payment Configuration Service
 * Manages test/live mode switching for Stripe and Paystack
 */

import { env } from './env';

export interface PaymentConfig {
  mode: 'test' | 'live';
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    soloPriceId: string;
    salonPriceId: string;
  };
  paystack: {
    secretKey: string;
    publicKey: string;
    plans: {
      soloGHS: string;
      salonGHS: string;
      soloNGN: string;
      salonNGN: string;
    };
  };
}

function getPaymentConfig(): PaymentConfig {
  const mode = (env.PAYMENT_MODE || 'test') as 'test' | 'live';

  if (mode === 'live') {
    // Validate all required live keys are present
    if (!env.STRIPE_LIVE_SECRET_KEY) {
      throw new Error('STRIPE_LIVE_SECRET_KEY is required for live mode');
    }
    if (!env.PAYSTACK_LIVE_SECRET_KEY) {
      throw new Error('PAYSTACK_LIVE_SECRET_KEY is required for live mode');
    }

    return {
      mode: 'live',
      stripe: {
        secretKey: env.STRIPE_LIVE_SECRET_KEY,
        publishableKey: env.STRIPE_LIVE_PUBLISHABLE_KEY || '',
        webhookSecret: env.STRIPE_LIVE_WEBHOOK_SECRET || '',
        soloPriceId: env.STRIPE_LIVE_SOLO_PRICE_ID || '',
        salonPriceId: env.STRIPE_LIVE_SALON_PRICE_ID || '',
      },
      paystack: {
        secretKey: env.PAYSTACK_LIVE_SECRET_KEY,
        publicKey: env.PAYSTACK_LIVE_PUBLIC_KEY || '',
        plans: {
          soloGHS: env.PAYSTACK_SOLO_GHS_PLAN || 'bnb_solo_ghs',
          salonGHS: env.PAYSTACK_SALON_GHS_PLAN || 'bnb_salon_ghs',
          soloNGN: env.PAYSTACK_SOLO_NGN_PLAN || 'bnb_solo_ngn',
          salonNGN: env.PAYSTACK_SALON_NGN_PLAN || 'bnb_salon_ngn',
        },
      },
    };
  }

  // Test mode (default)
  return {
    mode: 'test',
    stripe: {
      secretKey: env.STRIPE_TEST_SECRET_KEY || env.STRIPE_SECRET_KEY || '',
      publishableKey: env.STRIPE_TEST_PUBLISHABLE_KEY || '',
      webhookSecret: env.STRIPE_TEST_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET || '',
      soloPriceId: env.STRIPE_TEST_SOLO_PRICE_ID || env.STRIPE_SOLO_PRICE_ID || '',
      salonPriceId: env.STRIPE_TEST_SALON_PRICE_ID || env.STRIPE_SALON_PRICE_ID || '',
    },
    paystack: {
      secretKey: env.PAYSTACK_TEST_SECRET_KEY || env.PAYSTACK_SECRET_KEY || '',
      publicKey: env.PAYSTACK_TEST_PUBLIC_KEY || '',
      plans: {
        soloGHS: env.PAYSTACK_SOLO_GHS_PLAN || 'bnb_solo_ghs',
        salonGHS: env.PAYSTACK_SALON_GHS_PLAN || 'bnb_salon_ghs',
        soloNGN: env.PAYSTACK_SOLO_NGN_PLAN || 'bnb_solo_ngn',
        salonNGN: env.PAYSTACK_SALON_NGN_PLAN || 'bnb_salon_ngn',
      },
    },
  };
}

export const paymentConfig = getPaymentConfig();

// Log current payment mode on startup
console.log(`[Payment Config] Running in ${paymentConfig.mode.toUpperCase()} mode`);
