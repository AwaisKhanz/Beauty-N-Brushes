import { Router } from 'express';
import * as providerController from '../controllers/provider.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Public provider profile
router.get('/:slug/public', providerController.getPublicProfile);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Provider profile management
router.post('/profile/pause', authenticate, providerController.pauseProfile);
router.post('/profile/resume', authenticate, providerController.resumeProfile);

// Admin routes
router.post('/admin/:providerId/deactivate', authenticate, providerController.deactivateProvider);
router.post('/admin/:providerId/reactivate', authenticate, providerController.reactivateProvider);

export default router;
