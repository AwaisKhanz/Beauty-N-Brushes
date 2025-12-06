import { Router } from 'express';
import { getPlatformConfig, updatePlatformFeeConfig } from '../controllers/platform-config.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

/**
 * @route   GET /api/v1/platform/fee-config
 * @desc    Get platform fee configuration
 * @access  Public
 */
router.get('/fee-config', getPlatformConfig);

/**
 * @route   PUT /api/v1/platform/fee-config
 * @desc    Update platform fee configuration
 * @access  Admin only
 */
router.put('/fee-config', authenticate, authorize('ADMIN'), updatePlatformFeeConfig);

export default router;
