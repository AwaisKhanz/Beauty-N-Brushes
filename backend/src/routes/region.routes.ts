import { Router } from 'express';
import { detectRegion } from '../controllers/region.controller';

const router = Router();

/**
 * Public endpoint - no authentication required
 * Used by frontend to detect region for anonymous users
 */
router.get('/detect', detectRegion);

export default router;
