import { Router } from 'express';
import express from 'express';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

// Stripe webhook - requires raw body for signature verification
// Must be before JSON parsing middleware
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

// Paystack webhook - requires raw body for signature verification
router.post(
  '/paystack',
  express.raw({ type: 'application/json' }),
  webhookController.handlePaystackWebhook
);

export default router;
