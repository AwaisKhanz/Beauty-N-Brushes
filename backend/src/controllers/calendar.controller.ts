import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { googleCalendarService } from '../lib/google-calendar';
import { calendarSyncService } from '../services/calendar-sync.service';
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
import { z } from 'zod';

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

    const schema = z.object({
      schedule: z
        .array(
          z.object({
            dayOfWeek: z.number().int().min(0).max(6),
            startTime: z
              .string()
              .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
            endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
            isAvailable: z.boolean(),
          })
        )
        .min(1, 'Schedule is required')
        .refine((schedule) => schedule.some((day) => day.isAvailable), {
          message: 'At least one day must be available',
        }),
      timezone: z.string().optional(),
      advanceBookingDays: z.number().int().min(1).max(365).optional(),
      minimumNoticeHours: z.number().int().min(0).max(168).optional(),
      bufferMinutes: z.number().int().min(0).max(120).optional(),
      sameDayBooking: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as UpdateAvailabilityRequest;
    const {
      schedule,
      timezone,
      advanceBookingDays,
      minimumNoticeHours,
      bufferMinutes,
      sameDayBooking,
    } = data;

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
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
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

/**
 * Initiate Google Calendar OAuth flow
 */
export async function connectGoogleCalendar(
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
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Use provider ID as state for OAuth callback
    const authUrl = googleCalendarService.getAuthUrl(userId);

    sendSuccess(res, {
      authUrl,
      message: 'Redirect to this URL to connect Google Calendar',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Google Calendar OAuth callback
 */
export async function handleGoogleCalendarCallback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'Authorization code required');
    }

    if (!state || typeof state !== 'string') {
      throw new AppError(400, 'Invalid state parameter');
    }

    const userId = state;

    // Exchange code for tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code);

    // Save Google Calendar connection to provider profile
    await prisma.providerProfile.update({
      where: { userId },
      data: {
        googleCalendarConnected: true,
        googleAccessToken: tokens.accessToken,
        googleRefreshToken: tokens.refreshToken,
        googleEmail: tokens.email,
        googleCalendarLastSync: new Date(),
      },
    });

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/provider/settings/calendar?connected=true`);
  } catch (error) {
    console.error('Google Calendar OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/provider/settings/calendar?error=connection_failed`);
  }
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(
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
      select: { googleCalendarConnected: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (!profile.googleCalendarConnected) {
      throw new AppError(400, 'Google Calendar not connected');
    }

    // Remove Google Calendar connection
    await prisma.providerProfile.update({
      where: { userId },
      data: {
        googleCalendarConnected: false,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleEmail: null,
        googleCalendarLastSync: null,
      },
    });

    sendSuccess(res, {
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sync external Google Calendar events to block BNB availability
 */
export async function syncExternalEvents(
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

    if (!profile.googleCalendarConnected) {
      throw new AppError(400, 'Google Calendar not connected');
    }

    // Trigger sync
    await calendarSyncService.syncExternalEventsToAvailability(profile.id);

    sendSuccess(res, {
      message: 'External calendar events synced successfully',
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
