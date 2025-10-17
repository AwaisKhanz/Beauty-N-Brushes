import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Placeholder routes
router.get('/', (_req, res) => {
  res.json({ message: 'Get bookings endpoint - to be implemented' });
});

router.get('/:id', (_req, res) => {
  res.json({ message: 'Get booking by ID endpoint - to be implemented' });
});

router.post('/', (_req, res) => {
  res.json({ message: 'Create booking endpoint - to be implemented' });
});

export default router;
