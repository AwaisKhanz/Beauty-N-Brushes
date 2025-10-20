import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as favoriteController from '../controllers/favorite.controller';

const router = Router();

// All favorite routes require authentication
router.use(authenticate);

// Toggle favorite provider
router.post('/toggle', favoriteController.toggleFavorite);

// Get all favorites
router.get('/', favoriteController.getFavorites);

export default router;
