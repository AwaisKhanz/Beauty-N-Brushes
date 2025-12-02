import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { attachProviderContext, requireOwner } from '../middleware/providerAccess';
import * as financeController from '../controllers/finance.controller';

const router = Router();

// All finance routes require authentication, provider context, and OWNER permission
router.use(authenticate);
router.use(attachProviderContext);
router.use(requireOwner); // Finance is owner-only

// GET /api/v1/finance/summary - Get finance summary
router.get('/summary', financeController.getFinanceSummary);

// GET /api/v1/finance/earnings - Get earnings breakdown
router.get('/earnings', financeController.getEarningsBreakdown);

// GET /api/v1/finance/payouts - Get payout history
router.get('/payouts', financeController.getPayoutHistory);

// GET /api/v1/finance/bookings - Get booking financials
router.get('/bookings', financeController.getBookingFinancials);

// POST /api/v1/finance/payouts - Create payout request
router.post('/payouts', financeController.createPayout);

export default router;
