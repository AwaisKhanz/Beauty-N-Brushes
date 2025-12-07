/**
 * Auto-Cancel Unpaid Balance Job
 * Automatically cancels bookings where balance payment wasn't received
 * within 24 hours after the appointment
 */

import { prisma } from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { emailService } from '../../lib/email';
import { emitBookingUpdate } from '../../config/socket.server';
import logger from '../../utils/logger';

/**
 * Auto-cancel bookings with unpaid balance after appointment
 * - Finds CONFIRMED bookings past appointment date
 * - Payment status is DEPOSIT_PAID (not FULLY_PAID)
 * - More than 24 hours past appointment time
 * - Updates status to CANCELLED
 * - Sends notifications to client
 */
export async function autoCancelUnpaidBalance(): Promise<void> {
  const now = new Date();
  const BALANCE_DEADLINE_HOURS = 24;

  try {
    // Find CONFIRMED bookings past appointment with unpaid balance
    const unpaidBalanceBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'DEPOSIT_PAID', // Not FULLY_PAID
        appointmentDate: {
          lt: now, // Appointment date has passed
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            businessName: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
      },
    });

    logger.info(`[CRON] Found ${unpaidBalanceBookings.length} bookings with unpaid balance to check`);

    let cancelledCount = 0;

    for (const booking of unpaidBalanceBookings) {
      try {
        // Calculate appointment datetime and deadline
        const appointmentDateTime = new Date(`${booking.appointmentDate.toISOString().split('T')[0]}T${booking.appointmentTime}`);
        const deadlineTime = new Date(appointmentDateTime.getTime() + BALANCE_DEADLINE_HOURS * 60 * 60 * 1000);

        // Check if deadline has passed
        if (now > deadlineTime) {
          // Auto-cancel the booking
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              bookingStatus: 'CANCELLED_BY_CLIENT',
              cancelledAt: new Date(),
              cancellationReason: `Auto-cancelled - Balance payment not received within ${BALANCE_DEADLINE_HOURS} hours of appointment`,
            },
          });

          // Send notification to client
          await notificationService.createBookingCancelledNotification(
            booking.client.id,
            'System',
            booking.appointmentDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            booking.id,
            false // isProvider
          );

          // Send email to client (using existing auto-cancelled email template)
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

          // Emit socket event to client
          try {
            emitBookingUpdate(booking.client.id, {
              type: 'booking_cancelled',
              booking: {
                id: booking.id,
                serviceName: booking.service.title,
                status: 'CANCELLED',
                reason: 'Balance payment overdue',
              },
            });
          } catch (socketError) {
            logger.error(`[CRON] Failed to emit socket event for booking ${booking.id}:`, socketError);
          }

          cancelledCount++;
          logger.info(`[CRON] Auto-cancelled booking ${booking.id} - unpaid balance`);
        }
      } catch (error) {
        logger.error(`[CRON] Failed to process booking ${booking.id}:`, error);
        // Continue with other bookings even if one fails
      }
    }

    logger.info(`[CRON] Auto-cancel unpaid balance complete: ${cancelledCount} bookings cancelled`);
  } catch (error) {
    logger.error('[CRON] Error in autoCancelUnpaidBalance job:', error);
    throw error;
  }
}
