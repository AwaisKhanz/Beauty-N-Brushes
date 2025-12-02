/**
 * Booking Reminders Job
 * Sends 24-hour and 1-hour reminders for upcoming appointments
 */

import prisma from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { emitBookingUpdate } from '../../config/socket.server';
import { jobLogger } from '../utils/logger';
import { safeJob } from '../utils/error-handler';
import { getHoursFromNow, combineDateAndTime, batchProcess } from '../utils/helpers';
import { format } from 'date-fns';

/**
 * Send 24-hour booking reminders
 */
export const send24HourReminders = safeJob('booking-reminders-24h', async () => {
  jobLogger.start('booking-reminders-24h');

  try {
    // Get time range for 24 hours from now (with 5-minute window)
    const { start, end } = getHoursFromNow(24);

    console.log(`[CRON] Looking for bookings between ${start.toISOString()} and ${end.toISOString()}`);

    // Find confirmed bookings 24 hours from now
    const bookings = await prisma.booking.findMany({
      where: {
        bookingStatus: 'CONFIRMED',
        appointmentDate: {
          gte: start,
          lte: end,
        },
        // Only send if not already reminded
        reminder24hSent: false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        provider: {
          select: {
            userId: true,
            businessName: true,
            businessPhone: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${bookings.length} bookings for 24h reminders`);

    if (bookings.length === 0) {
      jobLogger.success('booking-reminders-24h', 0, { message: 'No bookings to remind' });
      return;
    }

    // Process reminders in batches
    const { processed, errors } = await batchProcess(
      bookings,
      async (booking) => {
        const appointmentDateTime = combineDateAndTime(
          booking.appointmentDate.toISOString(),
          booking.appointmentTime
        );

        // Send notification to client
        await notificationService.createBookingReminderNotification(
          booking.client.id,
          booking.provider.businessName,
          booking.id,
          format(appointmentDateTime, 'MMM dd, yyyy'),
          booking.appointmentTime
        );

        // Emit socket event to client
        emitBookingUpdate(booking.client.id, {
          type: 'booking_reminder',
          booking: {
            id: booking.id,
            providerName: booking.provider.businessName,
            serviceName: booking.service.title,
            appointmentDate: format(appointmentDateTime, 'MMM dd, yyyy'),
            appointmentTime: booking.appointmentTime,
            reminderType: '24h',
          },
        });

        // Send notification to provider
        await notificationService.createBookingReminderNotification(
          booking.provider.userId,
          `${booking.client.firstName} ${booking.client.lastName}`,
          booking.id,
          format(appointmentDateTime, 'MMM dd, yyyy'),
          booking.appointmentTime
        );

        // Emit socket event to provider
        emitBookingUpdate(booking.provider.userId, {
          type: 'booking_reminder',
          booking: {
            id: booking.id,
            clientName: `${booking.client.firstName} ${booking.client.lastName}`,
            serviceName: booking.service.title,
            appointmentDate: format(appointmentDateTime, 'MMM dd, yyyy'),
            appointmentTime: booking.appointmentTime,
            reminderType: '24h',
          },
        });

        // Mark reminder as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder24hSent: true },
        });

        console.log(`[CRON] Sent 24h reminder for booking ${booking.id}`);
      },
      5 // Process 5 at a time
    );

    if (errors.length > 0) {
      jobLogger.partial('booking-reminders-24h', processed, errors);
    } else {
      jobLogger.success('booking-reminders-24h', processed, {
        bookingsReminded: processed,
      });
    }
  } catch (error) {
    jobLogger.error('booking-reminders-24h', error as Error);
    throw error;
  }
});

/**
 * Send 1-hour booking reminders
 */
export const send1HourReminders = safeJob('booking-reminders-1h', async () => {
  jobLogger.start('booking-reminders-1h');

  try {
    // Get time range for 1 hour from now (with 2-minute window)
    const { start, end } = getHoursFromNow(1);

    console.log(`[CRON] Looking for bookings between ${start.toISOString()} and ${end.toISOString()}`);

    // Find confirmed bookings 1 hour from now
    const bookings = await prisma.booking.findMany({
      where: {
        bookingStatus: 'CONFIRMED',
        appointmentDate: {
          gte: start,
          lte: end,
        },
        // Only send if not already reminded
        reminder1hSent: false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        provider: {
          select: {
            userId: true,
            businessName: true,
            businessPhone: true,
            city: true,
            state: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
          },
        },
        service: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${bookings.length} bookings for 1h reminders`);

    if (bookings.length === 0) {
      jobLogger.success('booking-reminders-1h', 0, { message: 'No bookings to remind' });
      return;
    }

    // Process reminders in batches
    const { processed, errors } = await batchProcess(
      bookings,
      async (booking) => {
        const appointmentDateTime = combineDateAndTime(
          booking.appointmentDate.toISOString(),
          booking.appointmentTime
        );

        // Send urgent notification to client
        await notificationService.createBookingReminderNotification(
          booking.client.id,
          booking.provider.businessName,
          booking.id,
          format(appointmentDateTime, 'MMM dd, yyyy'),
          booking.appointmentTime
        );

        // Emit socket event to client
        emitBookingUpdate(booking.client.id, {
          type: 'booking_reminder',
          booking: {
            id: booking.id,
            providerName: booking.provider.businessName,
            serviceName: booking.service.title,
            appointmentDate: format(appointmentDateTime, 'MMM dd, yyyy'),
            appointmentTime: booking.appointmentTime,
            address: `${booking.provider.locations[0]?.addressLine1 || ''}, ${booking.provider.city}, ${booking.provider.state}`,
            reminderType: '1h',
          },
        });

        // Send notification to provider
        await notificationService.createBookingReminderNotification(
          booking.provider.userId,
          `${booking.client.firstName} ${booking.client.lastName}`,
          booking.id,
          format(appointmentDateTime, 'MMM dd, yyyy'),
          booking.appointmentTime
        );

        // Emit socket event to provider
        emitBookingUpdate(booking.provider.userId, {
          type: 'booking_reminder',
          booking: {
            id: booking.id,
            clientName: `${booking.client.firstName} ${booking.client.lastName}`,
            serviceName: booking.service.title,
            appointmentDate: format(appointmentDateTime, 'MMM dd, yyyy'),
            appointmentTime: booking.appointmentTime,
            reminderType: '1h',
          },
        });

        // Mark reminder as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder1hSent: true },
        });

        console.log(`[CRON] Sent 1h reminder for booking ${booking.id}`);
      },
      5 // Process 5 at a time
    );

    if (errors.length > 0) {
      jobLogger.partial('booking-reminders-1h', processed, errors);
    } else {
      jobLogger.success('booking-reminders-1h', processed, {
        bookingsReminded: processed,
      });
    }
  } catch (error) {
    jobLogger.error('booking-reminders-1h', error as Error);
    throw error;
  }
});
