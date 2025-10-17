import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as calendarController from '../controllers/calendar.controller';

const router = Router();

// All calendar routes require authentication
router.use(authenticate);

// Availability management
router.get('/availability', calendarController.getAvailability);
router.put('/availability', calendarController.updateAvailability);

// Blocked dates (time off)
router.get('/blocked-dates', calendarController.getBlockedDates);
router.post('/blocked-dates', calendarController.createBlockedDate);
router.delete('/blocked-dates/:blockedDateId', calendarController.deleteBlockedDate);

export default router;
