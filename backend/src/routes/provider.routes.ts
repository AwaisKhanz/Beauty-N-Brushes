import { Router } from 'express';
import * as providerController from '../controllers/provider.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Provider profile management (require authentication)
router.post('/profile/pause', authenticate, providerController.pauseProfile);
router.post('/profile/resume', authenticate, providerController.resumeProfile);

// Admin routes (require authentication and admin role)
router.post('/admin/:providerId/deactivate', authenticate, providerController.deactivateProvider);
router.post('/admin/:providerId/reactivate', authenticate, providerController.reactivateProvider);

export default router;
