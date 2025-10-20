/**
 * Like Routes
 * Routes for like operations
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as likeController from '../controllers/like.controller';

const router = Router();

// All like routes require authentication
router.use(authenticate);

router.post('/', likeController.toggle);
router.get('/my-likes', likeController.getMyLikes);
router.get('/status/:targetType/:targetId', likeController.checkStatus);

export default router;
