import { Router } from 'express';
import * as serviceController from '../controllers/service.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All service routes require authentication
router.use(authenticate);

// Service routes
router.get('/', serviceController.getProviderServices);
router.get('/:serviceId', serviceController.getServiceById);
router.post('/', serviceController.createService);

// Save service media URLs (files uploaded via /upload endpoint)
router.post('/:serviceId/media', serviceController.saveServiceMedia);

// AI service description generation
router.post('/ai/generate-description', serviceController.generateServiceDescription);

export default router;
