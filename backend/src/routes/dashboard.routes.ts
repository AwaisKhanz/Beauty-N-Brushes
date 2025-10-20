import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Provider Dashboard Routes
router.get('/stats', dashboardController.getProviderDashboardStats);
router.get('/bookings/recent', dashboardController.getRecentBookings);

// Client Dashboard Routes
router.get('/client/stats', dashboardController.getClientDashboardStats);
router.get('/client/bookings/recent', dashboardController.getClientRecentBookings);

export default router;
