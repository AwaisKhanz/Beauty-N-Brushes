import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  initializeBookingPayment,
} from '../controllers/payment.controller';

const router = Router();

// Initialize Paystack transaction (onboarding)
router.post('/paystack/initialize', authenticate, initializePaystackTransaction);

// Verify Paystack transaction (onboarding)
router.get('/paystack/verify/:reference', authenticate, verifyPaystackTransaction);

// Initialize booking payment (Stripe/Paystack)
router.post('/booking/initialize', authenticate, initializeBookingPayment);

export default router;
