import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as bookingController from '../controllers/booking.controller';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Availability routes (MUST be before :bookingId route)
router.get('/available-slots', bookingController.getAvailableSlots);
router.get('/available-stylists', bookingController.getAvailableStylists);

// Booking CRUD
router.post('/', bookingController.createBooking);
router.get('/', bookingController.listBookings);
router.get('/:bookingId', bookingController.getBooking);
router.put('/:bookingId', bookingController.updateBooking);

// Booking actions
router.post('/:bookingId/cancel', bookingController.cancelBooking);
router.post('/:bookingId/complete', bookingController.completeBooking);
router.post('/:bookingId/assign-team-member', bookingController.assignTeamMember);

export default router;
