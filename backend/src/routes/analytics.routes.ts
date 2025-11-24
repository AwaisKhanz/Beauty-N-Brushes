import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/analytics/summary - Get analytics summary
router.get('/summary', analyticsController.getAnalyticsSummary);

// GET /api/v1/analytics/trends - Get booking trends
router.get('/trends', analyticsController.getBookingTrends);

// GET /api/v1/analytics/services - Get service performance
router.get('/services', analyticsController.getServicePerformance);

// GET /api/v1/analytics/clients - Get client demographics
router.get('/clients', analyticsController.getClientDemographics);

// GET /api/v1/analytics/revenue - Get revenue breakdown
router.get('/revenue', analyticsController.getRevenueBreakdown);

export default router;
