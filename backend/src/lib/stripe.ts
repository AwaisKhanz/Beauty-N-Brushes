/**
 * Stripe Client Instance
 * Provides direct access to Stripe API for payment operations
 * Automatically switches between test and live mode based on PAYMENT_MODE
 */

import Stripe from 'stripe';
import { paymentConfig } from '../config/payment.config';

const apiKey = paymentConfig.stripe.secretKey;

if (!apiKey) {
  throw new Error('Stripe secret key is not configured');
}

export const stripe = new Stripe(apiKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

console.log(`[Stripe] Initialized in ${paymentConfig.mode.toUpperCase()} mode`);
