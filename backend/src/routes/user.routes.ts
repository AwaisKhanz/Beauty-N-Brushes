import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// User profile routes
router.get('/me', (_req, res) => {
  res.json({ message: 'Get current user endpoint - to be implemented' });
});

router.patch('/me', (_req, res) => {
  res.json({ message: 'Update current user endpoint - to be implemented' });
});

export default router;
