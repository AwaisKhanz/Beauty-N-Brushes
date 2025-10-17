import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard statistics
router.get('/stats', dashboardController.getProviderDashboardStats);

// Recent bookings
router.get('/bookings/recent', dashboardController.getRecentBookings);

export default router;
