/**
 * No-Show Detection Job
 * Automatically marks bookings as NO_SHOW if not completed within grace period
 */

import prisma from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { emitBookingUpdate } from '../../config/socket.server';
import { jobLogger } from '../utils/logger';
import { safeJob } from '../utils/error-handler';
import { combineDateAndTime, isPastWithGrace, batchProcess } from '../utils/helpers';
import cronConfig from '../config/cron.config';
import { format } from 'date-fns';

/**
 * Detect and mark no-show bookings
 */
export const detectNoShows = safeJob('no-show-detection', async () => {
  jobLogger.start('no-show-detection');

  try {
    const gracePeriodMinutes = cronConfig.noShowDetection.gracePeriodMinutes;
    const now = new Date();

    console.log(`[CRON] Checking for no-shows with ${gracePeriodMinutes} minute grace period`);

    // Find confirmed bookings that are past their appointment time + grace period
    const bookings = await prisma.booking.findMany({
      where: {
        bookingStatus: 'CONFIRMED',
        appointmentDate: {
          lte: now, // Appointment date is in the past
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
          },
        },
        service: {
          select: {
            title: true,
            durationMinutes: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${bookings.length} confirmed bookings to check`);

    // Filter bookings that are actually past grace period
    const noShowBookings = bookings.filter((booking) => {
      const appointmentDateTime = combineDateAndTime(
        booking.appointmentDate.toISOString(),
        booking.appointmentTime
      );
      return isPastWithGrace(appointmentDateTime, gracePeriodMinutes);
    });

    console.log(`[CRON] ${noShowBookings.length} bookings are past grace period`);

    if (noShowBookings.length === 0) {
      jobLogger.success('no-show-detection', 0, { message: 'No no-shows detected' });
      return;
    }

    // Process no-shows in batches
    const { processed, errors } = await batchProcess(
      noShowBookings,
      async (booking) => {
        const appointmentDateTime = combineDateAndTime(
          booking.appointmentDate.toISOString(),
          booking.appointmentTime
        );

        // Update booking status to NO_SHOW
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            bookingStatus: 'NO_SHOW',
            updatedAt: new Date(),
          },
        });

        // Send notification to client
        await notificationService.createBookingNoShowNotification(
          booking.client.id,
          booking.provider.businessName,
          booking.id,
          format(appointmentDateTime, 'MMM dd, yyyy')
        );

        // Emit socket event to client
        emitBookingUpdate(booking.client.id, {
          type: 'booking_no_show',
          booking: {
            id: booking.id,
            providerName: booking.provider.businessName,
            serviceName: booking.service.title,
            appointmentDate: format(appointmentDateTime, 'MMM dd, yyyy'),
            appointmentTime: booking.appointmentTime,
          },
        });

        // Send notification to provider
        await notificationService.createBookingNoShowNotification(
          booking.provider.userId,
          `${booking.client.firstName} ${booking.client.lastName}`,
          booking.id,
          format(appointmentDateTime, 'MMM dd, yyyy')
        );

        // Emit socket event to provider
        emitBookingUpdate(booking.provider.userId, {
          type: 'booking_no_show',
          booking: {
            id: booking.id,
            clientName: `${booking.client.firstName} ${booking.client.lastName}`,
            serviceName: booking.service.title,
            appointmentDate: format(appointmentDateTime, 'MMM dd, yyyy'),
            appointmentTime: booking.appointmentTime,
          },
        });

        // Update provider statistics
        await prisma.providerProfile.update({
          where: { id: booking.provider.id },
          data: {
            totalBookings: {
              increment: 1, // Count as completed booking for stats
            },
          },
        });

        console.log(`[CRON] Marked booking ${booking.id} as NO_SHOW`);
      },
      5 // Process 5 at a time
    );

    if (errors.length > 0) {
      jobLogger.partial('no-show-detection', processed, errors, {
        noShowsMarked: processed,
        gracePeriodMinutes,
      });
    } else {
      jobLogger.success('no-show-detection', processed, {
        noShowsMarked: processed,
        gracePeriodMinutes,
      });
    }
  } catch (error) {
    jobLogger.error('no-show-detection', error as Error);
    throw error;
  }
});
