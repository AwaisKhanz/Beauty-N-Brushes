import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as financeController from '../controllers/finance.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

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
