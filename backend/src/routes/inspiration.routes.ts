import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as inspirationController from '../controllers/inspiration.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Analyze inspiration image (ephemeral - no storage)
router.post('/analyze', inspirationController.analyzeInspiration);

// Match inspiration to providers (ephemeral search)
router.post('/match', inspirationController.matchInspiration);

export default router;
