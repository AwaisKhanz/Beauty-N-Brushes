import { Router } from 'express';
import * as instagramController from '../controllers/instagram.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Instagram OAuth flow
router.get('/connect', authenticate, instagramController.connectInstagram);
router.get('/callback', instagramController.handleCallback); // No auth - callback from Instagram

// Instagram operations (require authentication)
router.post('/import-media', authenticate, instagramController.importMedia);
router.post('/disconnect', authenticate, instagramController.disconnectInstagram);

export default router;
