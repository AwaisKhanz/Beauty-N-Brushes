import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as inspirationController from '../controllers/inspiration.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload inspiration image for analysis
router.post('/upload', inspirationController.uploadInspiration);

// Match inspiration to providers
router.post('/:inspirationId/match', inspirationController.matchInspiration);

// Get all inspirations for current user
router.get('/', inspirationController.getInspirations);

// Delete inspiration
router.delete('/:inspirationId', inspirationController.deleteInspiration);

export default router;
