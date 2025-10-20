/**
 * Stripe Client Instance
 * Provides direct access to Stripe API for payment operations
 */

import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY;

if (!apiKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(apiKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});
