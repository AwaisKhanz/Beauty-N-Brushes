/**
 * Review Routes
 * Routes for review operations
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as reviewController from '../controllers/review.controller';

const router = Router();

// Public routes
router.get('/provider/:providerId', reviewController.getByProvider);
router.get('/:reviewId', reviewController.getById);

// Protected routes
router.post('/', authenticate, reviewController.create);
router.put('/:reviewId', authenticate, reviewController.update);
router.delete('/:reviewId', authenticate, reviewController.remove);
router.post('/:reviewId/response', authenticate, reviewController.addResponse);
router.post('/:reviewId/helpful', authenticate, reviewController.toggleHelpful);

export default router;
