/**
 * Team Management Routes
 * Routes for salon team member management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { attachProviderContext, requireOwner } from '../middleware/providerAccess';
import * as teamController from '../controllers/team.controller';

const router = Router();

// Public route - get invitation details (no auth required)
router.get('/invitation/:invitationId', teamController.getInvitation);

// Specific routes that need authentication
router.get('/analytics', authenticate, attachProviderContext, teamController.getTeamAnalytics);

// All other team routes require authentication and provider context
router.use(authenticate);
router.use(attachProviderContext);

// Invitation acceptance/decline (authenticated)
router.post('/accept/:invitationId', teamController.acceptInvitation);
router.post('/decline/:invitationId', teamController.declineInvitation);

// Team member management (OWNER ONLY)
router.get('/', requireOwner, teamController.getTeamMembers);
router.post('/invite', requireOwner, teamController.inviteTeamMember);
router.put('/:memberId', requireOwner, teamController.updateTeamMember);
router.delete('/:memberId', requireOwner, teamController.deleteTeamMember);

// Generic param route LAST to avoid conflicts
router.get('/:memberId', requireOwner, teamController.getTeamMember);

export default router;

