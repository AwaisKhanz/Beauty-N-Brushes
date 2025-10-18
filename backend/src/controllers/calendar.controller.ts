import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type {
  GetAvailabilityResponse,
  UpdateAvailabilityRequest,
  UpdateAvailabilityResponse,
  CreateBlockedDateRequest,
  CreateBlockedDateResponse,
  GetBlockedDatesResponse,
  DeleteBlockedDateResponse,
  DaySchedule,
} from '../../../shared-types/calendar.types';

/**
 * Get provider availability schedule
 */
export async function getAvailability(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Map availability to response format
    const schedule: DaySchedule[] = profile.availability.map((avail) => ({
      dayOfWeek: avail.dayOfWeek,
      startTime: avail.startTime,
      endTime: avail.endTime,
      isAvailable: avail.isAvailable,
    }));

    const response: GetAvailabilityResponse = {
      schedule,
      settings: {
        timezone: profile.timezone || 'UTC',
        advanceBookingDays: profile.advanceBookingDays || 30,
        minimumNoticeHours: profile.minAdvanceHours || 24,
        bufferMinutes: profile.bookingBufferMinutes || 0,
        sameDayBooking: profile.sameDayBookingEnabled || false,
      },
    };

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}

/**
 * Update provider availability schedule
 */
export async function updateAvailability(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const {
      schedule,
      timezone,
      advanceBookingDays,
      minimumNoticeHours,
      bufferMinutes,
      sameDayBooking,
    } = req.body as UpdateAvailabilityRequest;

    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      throw new AppError(400, 'Schedule required');
    }

    // Validate at least one day is available
    const availableDays = schedule.filter((day) => day.isAvailable);
    if (availableDays.length === 0) {
      throw new AppError(400, 'At least one day must be available');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Update provider booking settings
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        timezone: timezone || profile.timezone,
        advanceBookingDays: advanceBookingDays ?? profile.advanceBookingDays,
        minAdvanceHours: minimumNoticeHours ?? profile.minAdvanceHours,
        bookingBufferMinutes: bufferMinutes ?? profile.bookingBufferMinutes,
        sameDayBookingEnabled: sameDayBooking ?? profile.sameDayBookingEnabled,
      },
    });

    // Delete existing availability
    await prisma.providerAvailability.deleteMany({
      where: { providerId: profile.id },
    });

    // Create new availability records
    await prisma.providerAvailability.createMany({
      data: schedule.map((day) => ({
        providerId: profile.id,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        isAvailable: day.isAvailable,
      })),
    });

    const response: UpdateAvailabilityResponse = {
      message: 'Availability updated successfully',
    };

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get blocked dates (time off)
 */
export async function getBlockedDates(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const timeOff = await prisma.providerTimeOff.findMany({
      where: {
        providerId: profile.id,
        endDate: {
          gte: new Date(), // Only future or ongoing time off
        },
      },
      orderBy: { startDate: 'asc' },
    });

    const blockedDates = timeOff.map((block) => ({
      id: block.id,
      startDate: block.startDate.toISOString(),
      endDate: block.endDate.toISOString(),
      reason: block.reason || undefined,
      allDay: block.allDay,
      startTime: block.startTime || undefined,
      endTime: block.endTime || undefined,
    }));

    const response: GetBlockedDatesResponse = {
      blockedDates,
    };

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}

/**
 * Create blocked date (time off)
 */
export async function createBlockedDate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { startDate, endDate, reason, allDay, startTime, endTime } =
      req.body as CreateBlockedDateRequest;

    if (!startDate || !endDate) {
      throw new AppError(400, 'Start date and end date required');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const timeOff = await prisma.providerTimeOff.create({
      data: {
        providerId: profile.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        allDay,
        startTime,
        endTime,
      },
    });

    const response: CreateBlockedDateResponse = {
      message: 'Time off created successfully',
      blockedDate: {
        id: timeOff.id,
        startDate: timeOff.startDate.toISOString(),
        endDate: timeOff.endDate.toISOString(),
        reason: timeOff.reason || undefined,
        allDay: timeOff.allDay,
        startTime: timeOff.startTime || undefined,
        endTime: timeOff.endTime || undefined,
      },
    };

    sendSuccess(res, response, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete blocked date
 */
export async function deleteBlockedDate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { blockedDateId } = req.params;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!blockedDateId) {
      throw new AppError(400, 'Blocked date ID required');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Verify the blocked date belongs to this provider
    const timeOff = await prisma.providerTimeOff.findFirst({
      where: {
        id: blockedDateId,
        providerId: profile.id,
      },
    });

    if (!timeOff) {
      throw new AppError(404, 'Blocked date not found or access denied');
    }

    await prisma.providerTimeOff.delete({
      where: { id: blockedDateId },
    });

    const response: DeleteBlockedDateResponse = {
      message: 'Blocked date deleted successfully',
    };

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}
