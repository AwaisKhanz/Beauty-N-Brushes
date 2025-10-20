import { Router } from 'express';
import * as serviceController from '../controllers/service.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Public search and discovery
router.get('/search', serviceController.searchServices);
router.get('/featured', serviceController.getFeaturedServices);
router.get('/categories', serviceController.getCategories);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(authenticate);

// Service routes
router.get('/', serviceController.getProviderServices);
router.get('/drafts', serviceController.getDraftServices);
router.get('/:serviceId', serviceController.getServiceById);
router.post('/', serviceController.createService);
router.put('/:serviceId', serviceController.updateService);

// Save service media URLs (files uploaded via /upload endpoint)
router.post('/:serviceId/media', serviceController.saveServiceMedia);

// AI service description generation
router.post('/ai/generate-description', serviceController.generateServiceDescription);
router.post('/ai/generate-hashtags', serviceController.generateHashtags);
router.post('/ai/analyze-image', serviceController.analyzeImage);

export default router;
