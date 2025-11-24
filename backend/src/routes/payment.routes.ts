import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  initializeBookingPayment,
  payBalance,
  payTip,
} from '../controllers/payment.controller';

const router = Router();

// Initialize Paystack transaction (onboarding)
router.post('/paystack/initialize', authenticate, initializePaystackTransaction);

// Verify Paystack transaction (onboarding)
router.get('/paystack/verify/:reference', authenticate, verifyPaystackTransaction);

// Initialize booking payment (Stripe/Paystack)
router.post('/booking/initialize', authenticate, initializeBookingPayment);

// Pay balance for booking
router.post('/booking/pay-balance', authenticate, payBalance);

// Pay tip for completed booking
router.post('/booking/pay-tip', authenticate, payTip);

export default router;
