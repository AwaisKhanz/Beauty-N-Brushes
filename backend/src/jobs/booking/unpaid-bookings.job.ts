/**
 * Unpaid Bookings Management Job
 * Handles payment reminders and auto-cancellation for unpaid bookings
 */

import { prisma } from '../../config/database';
import { emailService } from '../../lib/email';
import logger from '../../utils/logger';

/**
 * Send payment reminder emails to clients who haven't paid deposit
 * Sends to bookings that are:
 * - 2+ hours old
 * - Less than 24 hours old (not yet cancelled)
 * - Status: AWAITING_DEPOSIT
 * - Reminder not already sent
 */
export async function sendPaymentReminders(): Promise<void> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const bookingsNeedingReminder = await prisma.booking.findMany({
      where: {
        paymentStatus: 'AWAITING_DEPOSIT',
        paymentReminderSent: false,
        createdAt: {
          lte: twoHoursAgo, // At least 2 hours old
          gte: twentyFourHoursAgo, // Not older than 24 hours
        },
      },
      include: {
        client: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
      },
    });

    logger.info(`[CRON] Found ${bookingsNeedingReminder.length} bookings needing payment reminders`);

    for (const booking of bookingsNeedingReminder) {
      try {
        // Send reminder email
        await emailService.sendPaymentReminderEmail(
          booking.client.email,
          `${booking.client.firstName} ${booking.client.lastName}`,
          {
            id: booking.id,
            serviceName: booking.service.title,
            appointmentDate: booking.appointmentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            appointmentTime: booking.appointmentTime,
            depositAmount: Number(booking.depositAmount),
            currency: booking.currency,
          }
        );

        // Mark reminder as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentReminderSent: true,
            paymentReminderSentAt: new Date(),
          },
        });

        logger.info(`[CRON] Payment reminder sent for booking ${booking.id}`);
      } catch (error) {
        logger.error(`[CRON] Failed to send reminder for booking ${booking.id}:`, error);
        // Continue with other bookings even if one fails
      }
    }

    logger.info(`[CRON] Payment reminders complete: ${bookingsNeedingReminder.length} sent`);
  } catch (error) {
    logger.error('[CRON] Error in sendPaymentReminders job:', error);
    throw error;
  }
}

/**
 * Auto-cancel bookings that haven't been paid after 24 hours
 * Cancels bookings that are:
 * - 24+ hours old
 * - Status: AWAITING_DEPOSIT
 * - Not already cancelled
 */
export async function autoCancelUnpaidBookings(): Promise<void> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const bookingsToCancel = await prisma.booking.findMany({
      where: {
        paymentStatus: 'AWAITING_DEPOSIT',
        bookingStatus: 'PENDING',
        createdAt: {
          lte: twentyFourHoursAgo, // At least 24 hours old
        },
      },
      include: {
        client: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
      },
    });

    logger.info(`[CRON] Found ${bookingsToCancel.length} bookings to auto-cancel`);

    for (const booking of bookingsToCancel) {
      try {
        // Cancel the booking
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            bookingStatus: 'CANCELLED_BY_CLIENT',
            cancelledAt: new Date(),
            cancellationReason: 'Auto-cancelled: Deposit payment not received within 24 hours',
          },
        });

        // Send cancellation email
        await emailService.sendBookingAutoCancelledEmail(
          booking.client.email,
          `${booking.client.firstName} ${booking.client.lastName}`,
          {
            serviceName: booking.service.title,
            appointmentDate: booking.appointmentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            appointmentTime: booking.appointmentTime,
          }
        );

        logger.info(`[CRON] Booking ${booking.id} auto-cancelled`);
      } catch (error) {
        logger.error(`[CRON] Failed to cancel booking ${booking.id}:`, error);
        // Continue with other bookings even if one fails
      }
    }

    logger.info(`[CRON] Auto-cancel complete: ${bookingsToCancel.length} cancelled`);
  } catch (error) {
    logger.error('[CRON] Error in autoCancelUnpaidBookings job:', error);
    throw error;
  }
}
