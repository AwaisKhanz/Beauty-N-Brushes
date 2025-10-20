/**
 * Team Management Routes
 * Routes for salon team member management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as teamController from '../controllers/team.controller';

const router = Router();

// All team routes require authentication
router.use(authenticate);

// Team member management
router.get('/', teamController.getTeamMembers);
router.get('/analytics', teamController.getTeamAnalytics);
router.get('/:memberId', teamController.getTeamMember);
router.post('/invite', teamController.inviteTeamMember);
router.put('/:memberId', teamController.updateTeamMember);
router.delete('/:memberId', teamController.deleteTeamMember);

export default router;

