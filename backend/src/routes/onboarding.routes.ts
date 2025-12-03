import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller';
import * as subscriptionConfigController from '../controllers/subscription-config.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Public endpoint - anyone can view trial configuration
router.get('/subscription-config', subscriptionConfigController.getSubscriptionConfig);

// All other onboarding routes require authentication
router.use(authenticate);

// Account type selection
router.post('/account-type', onboardingController.createAccountType);

// Business details
router.post('/business-details', onboardingController.updateBusinessDetails);

// Save profile media URLs (files uploaded via /upload endpoint)
router.post('/profile-media', onboardingController.saveProfileMedia);

// Brand customization
router.post('/brand-customization', onboardingController.updateBrandCustomization);

// AI policy generation
router.post('/generate-policies', onboardingController.generateAIPolicies);

// Policies
router.post('/policies', onboardingController.savePolicies);

// Payment setup
router.post('/payment-setup', onboardingController.setupPayment);

// Availability setup
router.post('/availability', onboardingController.setupAvailability);

// Onboarding status
router.get('/status', onboardingController.getOnboardingStatus);

// Complete onboarding
router.post('/complete', onboardingController.completeOnboarding);

export default router;
