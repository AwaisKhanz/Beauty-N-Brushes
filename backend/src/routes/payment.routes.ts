import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  initializePaystackTransaction,
  initializePaystackSubscription,
  verifyPaystackTransaction,
  verifyPaystackSubscription,
  updatePaystackPaymentMethod,
  handlePaystackPaymentMethodCallback,
  initializeBookingPayment,
  payTip,
} from '../controllers/payment.controller';

const router = Router();

// Initialize Paystack transaction (onboarding - DEPRECATED, use /paystack/subscription/initialize)
router.post('/paystack/initialize', authenticate, initializePaystackTransaction);

// Initialize Paystack subscription (onboarding - NEW)
router.post('/paystack/subscription/initialize', authenticate, initializePaystackSubscription);

// Verify Paystack transaction (onboarding)
router.get('/paystack/verify/:reference', authenticate, verifyPaystackTransaction);

// Verify Paystack subscription payment (NEW)
router.get('/paystack/subscription/verify/:reference', authenticate, verifyPaystackSubscription);

// Update Paystack payment method (NEW)
router.post('/paystack/payment-method/update', authenticate, updatePaystackPaymentMethod);

// Handle payment method update callback (NEW)
router.get('/paystack/payment-method/callback', authenticate, handlePaystackPaymentMethodCallback);

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
