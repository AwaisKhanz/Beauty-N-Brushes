import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  initializeBookingPayment,
  payTip,
} from '../controllers/payment.controller';

const router = Router();

// Initialize Paystack transaction (onboarding)
router.post('/paystack/initialize', authenticate, initializePaystackTransaction);

// Verify Paystack transaction (onboarding)
router.get('/paystack/verify/:reference', authenticate, verifyPaystackTransaction);

// Initialize booking payment (Stripe/Paystack) - for both deposit and balance
router.post('/booking/initialize', authenticate, initializeBookingPayment);

// Pay tip for completed booking
router.post('/booking/pay-tip', authenticate, payTip);

// Phase 4.3: Create bank transfer virtual account
router.post('/bank-transfer/create', authenticate, async (req, res) => {
  const { createBankTransferAccount } = await import('../controllers/payment.controller-bank-transfer');
  return createBankTransferAccount(req, res);
});

export default router;
