/**
 * Auto-Decline Unconfirmed Bookings Job
 * Automatically declines bookings that providers haven't confirmed within 48 hours
 * and processes full refunds to clients
 */

import { prisma } from '../../config/database';
import { refundService } from '../../services/refund.service';
import { notificationService } from '../../services/notification.service';
import { emailService } from '../../lib/email';
import { emitBookingUpdate } from '../../config/socket.server';
import logger from '../../utils/logger';

/**
 * Auto-decline bookings that haven't been confirmed by provider within 48 hours
 * - Finds PENDING bookings with DEPOSIT_PAID status
 * - Created more than 48 hours ago
 * - Processes full refund (deposit + service fee)
 * - Updates status to CANCELLED_BY_PROVIDER
 * - Sends notifications to client
 */
export async function autoDeclineUnconfirmedBookings(): Promise<void> {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  try {
    // Find PENDING bookings with deposit paid, created > 48h ago
    const unconfirmedBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: 'PENDING',
        paymentStatus: 'DEPOSIT_PAID',
        createdAt: {
          lte: fortyEightHoursAgo,
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
            id: true,
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

    logger.info(`[CRON] Found ${unconfirmedBookings.length} unconfirmed bookings to auto-decline`);

    for (const booking of unconfirmedBookings) {
      try {
        // Calculate refund amount (full deposit + service fee)
        const refundAmount = Number(booking.depositAmount) + Number(booking.serviceFee);

        // Process refund
        const refundResult = await refundService.processRefund(
          booking.id,
          refundAmount,
          'Auto-declined - Provider did not confirm within 48 hours',
          'system' // Initiated by system auto-decline job
        );

        if (refundResult.success) {
          // Update booking status
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              bookingStatus: 'CANCELLED_BY_PROVIDER',
              paymentStatus: 'REFUNDED',
              cancelledAt: new Date(),
              cancellationReason: 'Auto-declined - Provider did not confirm within 48 hours',
            },
          });

          // Send notification to client
          await notificationService.createBookingCancelledNotification(
            booking.client.id,
            booking.provider.businessName,
            booking.appointmentDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            booking.id,
            false // isProvider = false (notification is for client)
          );

          // Send email to client
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
              type: 'booking_auto_declined',
              booking: {
                id: booking.id,
                providerName: booking.provider.businessName,
                serviceName: booking.service.title,
                appointmentDate: booking.appointmentDate.toISOString(),
                appointmentTime: booking.appointmentTime,
                status: 'CANCELLED_BY_PROVIDER',
                refundAmount,
                refunded: true,
              },
            });
          } catch (socketError) {
            logger.error(`[CRON] Failed to emit socket event for booking ${booking.id}:`, socketError);
          }

          logger.info(
            `[CRON] Auto-declined booking ${booking.id} - Refund of ${booking.currency} ${refundAmount.toFixed(2)} processed`
          );
        } else {
          logger.error(
            `[CRON] Failed to process refund for booking ${booking.id}: ${refundResult.error}`
          );
        }
      } catch (error) {
        logger.error(`[CRON] Failed to auto-decline booking ${booking.id}:`, error);
        // Continue with other bookings even if one fails
      }
    }

    logger.info(`[CRON] Auto-decline complete: ${unconfirmedBookings.length} bookings processed`);
  } catch (error) {
    logger.error('[CRON] Error in autoDeclineUnconfirmedBookings job:', error);
    throw error;
  }
}
