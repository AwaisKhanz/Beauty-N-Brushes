import { safeJob } from '../utils/error-handler';
import { jobLogger } from '../utils/logger';
import db from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { addDays, startOfDay } from 'date-fns';

/**
 * Send subscription expiry warnings
 * Runs daily at 9:00 AM
 * Sends warnings at 7, 3, and 1 day(s) before expiry
 */
export const sendSubscriptionWarnings = safeJob('subscription-warnings', async () => {
  jobLogger.start('subscription-warnings');
  
  const now = new Date();
  const warningDays = [7, 3, 1]; // Days before expiry to send warnings
  
  let totalWarningsSent = 0;

  try {
    for (const days of warningDays) {
      const targetDate = startOfDay(addDays(now, days));
      const nextDay = startOfDay(addDays(now, days + 1));

      // Find providers with subscriptions expiring in exactly 'days' days
      const expiringProviders = await db.providerProfile.findMany({
        where: {
          nextBillingDate: {
            gte: targetDate,
            lt: nextDay,
          },
          subscriptionStatus: {
            in: ['ACTIVE', 'TRIAL'], // Only warn active subscriptions
          },
        },
        select: {
          id: true,
          userId: true,
          businessName: true,
          nextBillingDate: true,
          subscriptionTier: true,
        },
      });

      console.log(`[CRON] Found ${expiringProviders.length} subscriptions expiring in ${days} day(s)`);

      // Send warnings
      for (const provider of expiringProviders) {
        try {
          await notificationService.createSubscriptionExpiringNotification(
            provider.userId,
            provider.nextBillingDate!,
            days
          );

          totalWarningsSent++;
          console.log(`[CRON] Sent ${days}-day warning to provider ${provider.id}`);
        } catch (error) {
          console.error(`[CRON] Failed to send warning to provider ${provider.id}:`, error);
        }
      }
    }

    jobLogger.success('subscription-warnings', totalWarningsSent, {
      warningsSent: totalWarningsSent,
    });
  } catch (error) {
    jobLogger.error('subscription-warnings', error as Error);
    throw error;
  }
});

/**
 * Auto-disable expired subscriptions
 * Runs daily at midnight
 * Marks expired subscriptions and notifies providers
 */
export const disableExpiredSubscriptions = safeJob('subscription-expiry', async () => {
  jobLogger.start('subscription-expiry');
  
  const now = new Date();
  let processedCount = 0;

  try {
    // Find providers with expired subscriptions
    const expiredProviders = await db.providerProfile.findMany({
      where: {
        nextBillingDate: {
          lt: now,
        },
        subscriptionStatus: {
          in: ['ACTIVE', 'TRIAL'], // Only process currently active subscriptions
        },
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        subscriptionTier: true,
        nextBillingDate: true,
      },
    });

    console.log(`[CRON] Found ${expiredProviders.length} expired subscriptions`);

    for (const provider of expiredProviders) {
      try {
        const previousTier = provider.subscriptionTier;

        // Update provider subscription status
        await db.providerProfile.update({
          where: { id: provider.id },
          data: {
            subscriptionStatus: 'EXPIRED',
            // Note: Keep tier as-is or set to BASIC based on business rules
            // subscriptionTier: 'BASIC',
          },
        });

        // Optionally deactivate services (based on business rules)
        // await db.service.updateMany({
        //   where: {
        //     providerId: provider.id,
        //     active: true,
        //   },
        //   data: {
        //     active: false,
        //   },
        // });

        // Send expiry notification
        await notificationService.createSubscriptionExpiredNotification(
          provider.userId,
          previousTier
        );

        processedCount++;
        console.log(`[CRON] Disabled expired subscription for provider ${provider.id}`);
      } catch (error) {
        console.error(`[CRON] Failed to process expired subscription for provider ${provider.id}:`, error);
      }
    }

    jobLogger.success('subscription-expiry', processedCount, {
      expiredSubscriptions: processedCount,
    });
  } catch (error) {
    jobLogger.error('subscription-expiry', error as Error);
    throw error;
  }
});
