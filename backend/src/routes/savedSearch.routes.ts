/**
 * Saved Search Routes
 * Routes for saved search operations
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as savedSearchController from '../controllers/savedSearch.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', savedSearchController.create);
router.get('/', savedSearchController.list);
router.get('/:searchId', savedSearchController.getById);
router.put('/:searchId', savedSearchController.update);
router.delete('/:searchId', savedSearchController.remove);

export default router;
