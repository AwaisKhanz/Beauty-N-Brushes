import { Router } from 'express';
import * as serviceController from '../controllers/service.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// AI service description generation
router.post('/generate-service-description', serviceController.generateServiceDescription);

export default router;
