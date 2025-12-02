import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as bookingController from '../controllers/booking.controller';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Availability routes (MUST be before :bookingId route)
router.get('/available-slots', bookingController.getAvailableSlots);
router.get('/available-stylists', bookingController.getAvailableStylists);

// Pending reviews (MUST be before :bookingId route)
router.get('/pending-reviews', bookingController.getPendingReviews);

// Booking CRUD
router.post('/', bookingController.createBooking);
router.get('/', bookingController.listBookings);
router.get('/:bookingId', bookingController.getBooking);
router.put('/:bookingId', bookingController.updateBooking);

// Booking actions
router.post('/:bookingId/confirm', bookingController.confirmBooking);
router.post('/:bookingId/cancel', bookingController.cancelBooking);
router.post('/:bookingId/reschedule', bookingController.rescheduleBooking);
router.post('/:bookingId/request-reschedule', bookingController.requestReschedule);
router.post(
  '/reschedule-requests/:requestId/respond',
  bookingController.respondToRescheduleRequest
);
router.post('/:bookingId/complete', bookingController.completeBooking);
router.post('/:bookingId/no-show', bookingController.markNoShow);
router.post('/:bookingId/assign-team-member', bookingController.assignTeamMember);

// Booking photos
router.post('/:bookingId/photos', bookingController.addBookingPhoto);
router.delete('/:bookingId/photos/:photoId', bookingController.deleteBookingPhoto);

export default router;
