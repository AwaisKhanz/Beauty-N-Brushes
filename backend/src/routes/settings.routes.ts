import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

// Profile/Business Settings
router.get('/profile', settingsController.getProfileSettings);
router.put('/profile', settingsController.updateProfileSettings);

// Booking Settings
router.get('/booking', settingsController.getBookingSettings);
router.put('/booking', settingsController.updateBookingSettings);

// Policies
router.get('/policies', settingsController.getPolicies);
router.put('/policies', settingsController.updatePolicies);

// Subscription & Payment
router.get('/subscription', settingsController.getSubscriptionInfo);
router.post('/payment-method', settingsController.updatePaymentMethod);

// Notifications
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

// Account
router.put('/account', settingsController.updateAccount);
router.post('/deactivate', settingsController.deactivateAccount);

export default router;
