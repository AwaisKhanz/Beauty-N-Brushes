/**
 * Notification Jobs Service
 * Handles automated email notifications for bookings
 */

import { prisma } from '../config/database';
import { emailService } from '../lib/email';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * Send 24-hour appointment reminders
 * Run this job every hour to check for upcoming appointments
 */
export async function send24HourReminders(): Promise<void> {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find bookings that are 23-24 hours away and haven't been reminded yet
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: twentyThreeHoursFromNow,
          lte: twentyFourHoursFromNow,
        },
        bookingStatus: {
          in: ['CONFIRMED', 'PENDING'],
        },
        reminder1hSent: false, // Using existing field
      },
      include: {
        client: {
          select: {
            email: true,
            firstName: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
        provider: {
          select: {
            businessName: true,
            businessPhone: true,
            city: true,
            state: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    logger.info(`Found ${upcomingBookings.length} bookings for 24h reminders`);

    for (const booking of upcomingBookings) {
      try {
        const location = booking.homeServiceFee && Number(booking.homeServiceFee) > 0
          ? 'Home Service'
          : `${booking.provider?.locations[0]?.addressLine1 || ''}, ${booking.provider?.city || ''}, ${booking.provider?.state || ''}`;

        const directionsUrl = booking.homeServiceFee && Number(booking.homeServiceFee) > 0
          ? ''
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

        // Calculate balance due
        const balanceDue = Number(booking.totalAmount) - Number(booking.depositAmount);

        await emailService.send24HourReminder(booking.client.email, {
          serviceName: booking.service?.title || 'Service',
          appointmentDate: new Date(booking.appointmentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          appointmentTime: booking.appointmentTime,
          providerName: booking.provider?.businessName || 'Provider',
          providerPhone: booking.provider?.businessPhone || '',
          providerEmail: booking.provider?.user?.email || '',
          location,
          balanceDue: `${booking.currency} ${balanceDue.toFixed(2)}`,
          bookingUrl: `${env.FRONTEND_URL}/client/bookings/${booking.id}`,
          directionsUrl,
        });

        // Mark as reminded
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder1hSent: true }, // Using existing field
        });

        logger.info(`Sent 24h reminder for booking ${booking.id}`);
      } catch (error) {
        logger.error(`Failed to send 24h reminder for booking ${booking.id}:`, error);
      }
    }

    logger.info(`Completed 24h reminder job: ${upcomingBookings.length} reminders sent`);
  } catch (error) {
    logger.error('Error in send24HourReminders job:', error);
    throw error;
  }
}

/**
 * Send review reminders for completed bookings
 * Run this job daily to check for bookings completed 1 day ago
 */
export async function sendReviewReminders(): Promise<void> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find completed bookings from 1-2 days ago without reviews
    const completedBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: 'COMPLETED',
        completedAt: {
          gte: twoDaysAgo,
          lte: oneDayAgo,
        },
        reviewDeadline: {
          gte: now, // Still within review window
        },
        review: null, // No review yet
      },
      include: {
        client: {
          select: {
            email: true,
            firstName: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    logger.info(`Found ${completedBookings.length} bookings for review reminders`);

    for (const booking of completedBookings) {
      try {
        await emailService.sendReviewReminder(booking.client.email, {
          clientName: booking.client.firstName || 'Valued Client',
          serviceName: booking.service?.title || 'Service',
          appointmentDate: new Date(booking.appointmentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          providerName: booking.provider?.businessName || 'Provider',
          reviewUrl: `${env.FRONTEND_URL}/client/bookings/${booking.id}/review`,
        });

        // Mark as reminded
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reviewReminderSent: true },
        });

        logger.info(`Sent review reminder for booking ${booking.id}`);
      } catch (error) {
        logger.error(`Failed to send review reminder for booking ${booking.id}:`, error);
      }
    }

    logger.info(`Completed review reminder job: ${completedBookings.length} reminders sent`);
  } catch (error) {
    logger.error('Error in sendReviewReminders job:', error);
    throw error;
  }
}

/**
 * Initialize notification jobs
 * This should be called when the server starts
 */
export function initializeNotificationJobs(): void {
  // Run 24-hour reminders every hour
  setInterval(() => {
    send24HourReminders().catch((error) => {
      logger.error('24h reminder job failed:', error);
    });
  }, 60 * 60 * 1000); // Every hour

  // Run review reminders every 6 hours
  setInterval(() => {
    sendReviewReminders().catch((error) => {
      logger.error('Review reminder job failed:', error);
    });
  }, 6 * 60 * 60 * 1000); // Every 6 hours

  // Run initial check on startup (after 1 minute)
  setTimeout(() => {
    send24HourReminders().catch((error) => {
      logger.error('Initial 24h reminder job failed:', error);
    });
    sendReviewReminders().catch((error) => {
      logger.error('Initial review reminder job failed:', error);
    });
  }, 60 * 1000); // After 1 minute

  logger.info('✅ Notification jobs initialized');
}
