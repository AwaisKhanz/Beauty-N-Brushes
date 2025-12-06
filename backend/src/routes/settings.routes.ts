import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { attachProviderContext, requireOwner } from '../middleware/providerAccess';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

// All settings routes require authentication, provider context, and OWNER permission
router.use(authenticate);
router.use(attachProviderContext);
router.use(requireOwner); // Settings are owner-only

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
router.post('/payment-method/setup-intent', settingsController.createSetupIntent);
router.post('/payment-method', settingsController.updatePaymentMethod);

// Notifications
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

// Account
router.put('/account', settingsController.updateAccount);
router.post('/deactivate', settingsController.deactivateAccount);

// Branding
router.get('/branding', settingsController.getBrandingSettings);
router.put('/branding', settingsController.updateBrandingSettings);

// Location
router.get('/location', settingsController.getLocationSettings);
router.put('/location', settingsController.updateLocationSettings);

// Business Details
router.get('/business-details', settingsController.getBusinessDetails);
router.put('/business-details', settingsController.updateBusinessDetails);

// Google Calendar
router.get('/calendar-status', settingsController.getGoogleCalendarStatus);

// Subscription Management
router.post('/subscription/change-tier', settingsController.changeSubscriptionTier);
router.post('/subscription/cancel', settingsController.cancelSubscription);
router.post('/subscription/resume', settingsController.resumeSubscription);

export default router;
