import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { attachProviderContext } from '../middleware/providerAccess';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Provider dashboard routes (with context)
router.get('/stats', attachProviderContext, dashboardController.getProviderDashboardStats);
router.get('/bookings/recent', attachProviderContext, dashboardController.getRecentBookings);

// Client dashboard routes (no context needed)
router.get('/client/stats', dashboardController.getClientDashboardStats);
router.get('/client/bookings/recent', dashboardController.getClientRecentBookings);

export default router;
