import { Router } from 'express';
import * as instagramController from '../controllers/instagram.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Instagram OAuth flow
router.get('/connect', authenticate, instagramController.connectInstagram);
router.get('/callback', instagramController.handleCallback); // No auth - callback from Instagram

// Instagram operations (require authentication)
router.get('/media', authenticate, instagramController.getMedia); // Fetch from Instagram
router.get('/imported', authenticate, instagramController.getImportedMedia); // Get from database
router.post('/import', authenticate, instagramController.importMedia); // Save selected media
router.post('/link-to-service', authenticate, instagramController.linkMediaToService); // Link to service
router.post('/disconnect', authenticate, instagramController.disconnectInstagram);

export default router;
