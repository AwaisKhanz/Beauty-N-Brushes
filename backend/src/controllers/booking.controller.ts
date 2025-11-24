/**
 * Booking Controller
 * Handles booking operations with team member assignment support
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { bookingService } from '../services/booking.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type {
  CreateBookingRequest,
  CreateBookingResponse,
  GetBookingResponse,
  GetBookingsResponse,
  UpdateBookingRequest,
  UpdateBookingResponse,
  CancelBookingRequest,
  CancelBookingResponse,
  RescheduleBookingRequest,
  RescheduleBookingResponse,
  CompleteBookingRequest,
  CompleteBookingResponse,
  AssignTeamMemberRequest,
  AssignTeamMemberResponse,
  RequestRescheduleRequest,
  RequestRescheduleResponse,
  RespondToRescheduleRequest,
  RespondToRescheduleResponse,
  GetAvailableStylists,
  GetAvailableSlotsResponse,
  BookingDetails,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Create booking
 */
export async function createBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      serviceId: z.string().uuid(),
      appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
      appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
      // Contact information (Required per requirements)
      contactEmail: z.string().email('Valid email required'),
      contactPhone: z.string().min(10, 'Valid phone number required'),
      specialRequests: z.string().max(1000).optional(),
      referencePhotoUrls: z.array(z.string().url()).optional(),
      selectedAddonIds: z.array(z.string().uuid()).optional(),
      // Home service request
      homeServiceRequested: z.boolean().optional(),
      // Team member selection for salon bookings
      assignedTeamMemberId: z.string().uuid().optional(),
      anyAvailableStylist: z.boolean().optional(),
      paymentMethodId: z.string().optional(),
    });

    const data = schema.parse(req.body) as CreateBookingRequest;

    const booking = await bookingService.createBooking(userId, data);

    sendSuccess<CreateBookingResponse>(
      res,
      {
        message: 'Booking created successfully',
        booking: booking as unknown as BookingDetails,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Get booking by ID
 */
export async function getBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const booking = await bookingService.getBooking(userId, bookingId, userRole || 'CLIENT');

    sendSuccess<GetBookingResponse>(res, {
      message: 'Booking retrieved',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List bookings
 */
export async function listBookings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) throw new AppError(401, 'Unauthorized');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await bookingService.listBookings(userId, userRole || 'CLIENT', page, limit);

    sendSuccess<GetBookingsResponse>(res, {
      message: 'Bookings retrieved',
      bookings: result.bookings as unknown as BookingDetails[],
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update booking
 */
export async function updateBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const schema = z.object({
      appointmentDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      appointmentTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
      appointmentEndTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
      specialRequests: z.string().max(1000).optional(),
      internalNotes: z.string().max(1000).optional(),
      assignedTeamMemberId: z.string().uuid().optional(),
    });

    const data = schema.parse(req.body) as UpdateBookingRequest;

    const booking = await bookingService.updateBooking(userId, bookingId, data);

    sendSuccess<UpdateBookingResponse>(res, {
      message: 'Booking updated successfully',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Confirm a booking (Provider only)
 */
export async function confirmBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const booking = await bookingService.confirmBooking(userId, bookingId);

    sendSuccess<UpdateBookingResponse>(res, {
      message: 'Booking confirmed successfully',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign team member to booking (salon admin)
 */
export async function assignTeamMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const schema = z.object({
      teamMemberId: z.string().uuid(),
    });

    const data = schema.parse(req.body) as AssignTeamMemberRequest;

    const booking = await bookingService.assignTeamMember(userId, bookingId, data);

    sendSuccess<AssignTeamMemberResponse>(res, {
      message: 'Team member assigned successfully',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Get available time slots for a provider/service on a specific date
 */
export async function getAvailableSlots(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { providerId, serviceId, date } = req.query;

    if (!providerId || !date) {
      throw new AppError(400, 'Provider ID and date required');
    }

    const slots = await bookingService.getAvailableSlots(
      providerId as string,
      serviceId as string,
      date as string
    );

    sendSuccess<GetAvailableSlotsResponse>(res, {
      message: 'Available slots retrieved',
      date: date as string,
      slots,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available stylists for booking slot (salon only)
 */
export async function getAvailableStylists(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { providerId, date, time, duration } = req.query;

    if (!providerId || !date || !time || !duration) {
      throw new AppError(400, 'Provider ID, date, time, and duration required');
    }

    const stylists = await bookingService.getAvailableStylists(
      providerId as string,
      date as string,
      time as string,
      parseInt(duration as string)
    );

    sendSuccess<GetAvailableStylists>(res, {
      message: 'Available stylists retrieved',
      stylists,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const schema = z.object({
      reason: z.string().max(500).optional(),
      cancelledBy: z.enum(['client', 'provider']),
    });

    const data = schema.parse(req.body) as CancelBookingRequest;

    const booking = await bookingService.cancelBooking(userId, bookingId, data);

    sendSuccess<CancelBookingResponse>(res, {
      message: 'Booking cancelled successfully',
      refundAmount: Number(booking.depositAmount),
      refundStatus: 'pending',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Reschedule booking
 */
export async function rescheduleBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const schema = z.object({
      newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
      newTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
      reason: z.string().max(500).optional(),
    });

    const data = schema.parse(req.body) as RescheduleBookingRequest;

    const booking = await bookingService.rescheduleBooking(userId, bookingId, data);

    sendSuccess<RescheduleBookingResponse>(res, {
      message: 'Booking rescheduled successfully',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Request reschedule (provider only)
 */
export async function requestReschedule(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const schema = z.object({
      newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
      newTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
      reason: z.string().min(1, 'Reason is required').max(500),
    });

    const data = schema.parse(req.body) as RequestRescheduleRequest;

    const rescheduleRequest = await bookingService.requestReschedule(userId, bookingId, data);

    sendSuccess<RequestRescheduleResponse>(res, {
      message: 'Reschedule request sent successfully',
      rescheduleRequest: {
        id: rescheduleRequest.id,
        bookingId: rescheduleRequest.bookingId,
        newDate: rescheduleRequest.newDate.toISOString().split('T')[0],
        newTime: rescheduleRequest.newTime,
        reason: rescheduleRequest.reason,
        status: rescheduleRequest.status as 'pending' | 'approved' | 'denied',
        requestedAt: rescheduleRequest.requestedAt.toISOString(),
        respondedAt: rescheduleRequest.respondedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Respond to reschedule request (client only)
 */
export async function respondToRescheduleRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!requestId) throw new AppError(400, 'Request ID required');

    const schema = z.object({
      approved: z.boolean(),
      reason: z.string().max(500).optional(),
    });

    const data = schema.parse(req.body) as RespondToRescheduleRequest;

    const booking = await bookingService.respondToRescheduleRequest(userId, requestId, data);

    sendSuccess<RespondToRescheduleResponse>(res, {
      message: data.approved ? 'Reschedule request approved' : 'Reschedule request denied',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Complete booking
 */
export async function completeBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const schema = z.object({
      tipAmount: z.number().min(0).optional(),
      notes: z.string().max(1000).optional(),
      balancePaymentMethod: z.enum(['online', 'cash', 'card_at_venue']).optional(),
    });

    const data = schema.parse(req.body) as CompleteBookingRequest;

    const booking = await bookingService.completeBooking(userId, bookingId, data);

    sendSuccess<CompleteBookingResponse>(res, {
      message: 'Booking completed successfully',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Mark booking as no-show
 */
export async function markNoShow(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { bookingId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!bookingId) throw new AppError(400, 'Booking ID required');

    const schema = z.object({
      notes: z.string().max(500).optional(),
    });

    const data = schema.parse(req.body);

    const booking = await bookingService.markNoShow(
      userId,
      userRole || 'CLIENT',
      bookingId,
      data.notes
    );

    sendSuccess<UpdateBookingResponse>(res, {
      message: 'Booking marked as no-show',
      booking: booking as unknown as BookingDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}
