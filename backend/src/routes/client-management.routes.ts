import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as clientManagementController from '../controllers/client-management.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/clients - Get all clients
router.get('/', clientManagementController.getClients);

// GET /api/v1/clients/:clientId - Get client detail
router.get('/:clientId', clientManagementController.getClientDetail);

// POST /api/v1/clients/notes - Create client note
router.post('/notes', clientManagementController.createNote);

// PUT /api/v1/clients/notes/:noteId - Update client note
router.put('/notes/:noteId', clientManagementController.updateNote);

// DELETE /api/v1/clients/notes/:noteId - Delete client note
router.delete('/notes/:noteId', clientManagementController.deleteNote);

export default router;
