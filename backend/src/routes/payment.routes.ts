import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from '../controllers/payment.controller';

const router = Router();

// Initialize Paystack transaction
router.post('/paystack/initialize', authenticate, initializePaystackTransaction);

// Verify Paystack transaction
router.get('/paystack/verify/:reference', authenticate, verifyPaystackTransaction);

export default router;
