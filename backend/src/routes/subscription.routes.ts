import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  pauseSubscription,
  resumeSubscription,
  getSubscriptionDetails,
  cancelSubscription,
} from '../controllers/subscription.controller';

const router = Router();

/**
 * @route   GET /api/v1/subscription
 * @desc    Get subscription details
 * @access  Private
 */
router.get('/', authenticate, getSubscriptionDetails);

/**
 * @route   POST /api/v1/subscription/pause
 * @desc    Pause subscription
 * @access  Private
 */
router.post('/pause', authenticate, pauseSubscription);

/**
 * @route   POST /api/v1/subscription/resume
 * @desc    Resume subscription
 * @access  Private
 */
router.post('/resume', authenticate, resumeSubscription);

/**
 * @route   POST /api/v1/subscription/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/cancel', authenticate, cancelSubscription);

export default router;
