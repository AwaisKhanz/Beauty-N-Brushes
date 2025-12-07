/**
 * Cron Job Scheduler
 * Main entry point for all scheduled jobs
 */

import * as cron from 'node-cron';
import cronConfig from './config/cron.config';
import { jobLogger } from './utils/logger';

// Job registry
const jobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Register a cron job
 */
export function registerJob(
  name: string,
  schedule: string,
  handler: () => Promise<void>,
  enabled: boolean = true
): void {
  if (!enabled) {
    console.log(`[CRON] Job "${name}" is disabled`);
    return;
  }

  if (!cron.validate(schedule)) {
    console.error(`[CRON] Invalid cron schedule for job "${name}": ${schedule}`);
    return;
  }

  const task = cron.schedule(
    schedule,
    async () => {
      try {
        await handler();
      } catch (error) {
        console.error(`[CRON] Job "${name}" failed:`, error);
      }
    },
    {
      timezone: cronConfig.timezone,
    }
  );

  jobs.set(name, task);
  console.log(`[CRON] Registered job "${name}" with schedule: ${schedule} (${cronConfig.timezone})`);
}

/**
 * Start all registered jobs
 */
export function startAllJobs(): void {
  if (!cronConfig.enabled) {
    console.log('[CRON] Cron jobs are disabled via configuration');
    return;
  }

  console.log(`[CRON] Starting ${jobs.size} cron jobs...`);
  jobs.forEach((task, name) => {
    task.start();
    console.log(`[CRON] Started job: ${name}`);
  });
  console.log('[CRON] All jobs started successfully');
}

/**
 * Stop all jobs
 */
export function stopAllJobs(): void {
  console.log('[CRON] Stopping all cron jobs...');
  jobs.forEach((task, name) => {
    task.stop();
    console.log(`[CRON] Stopped job: ${name}`);
  });
  console.log('[CRON] All jobs stopped');
}

/**
 * Get job status
 */
export function getJobStatus(name: string): { running: boolean; lastRun?: Date } | null {
  if (!jobs.has(name)) return null;

  const log = jobLogger.getLog(name);
  return {
    running: jobs.has(name),
    lastRun: log?.startTime,
  };
}

/**
 * Get all job statuses
 */
export function getAllJobStatuses(): Array<{
  name: string;
  running: boolean;
  lastRun?: Date;
  status?: string;
}> {
  const statuses: Array<{
    name: string;
    running: boolean;
    lastRun?: Date;
    status?: string;
  }> = [];

  jobs.forEach((_task, name) => {
    const log = jobLogger.getLog(name);
    statuses.push({
      name,
      running: true,
      lastRun: log?.startTime,
      status: log?.status,
    });
  });

  return statuses;
}

/**
 * Initialize all cron jobs
 * This will be called from server.ts
 */
export async function initializeCronJobs(): Promise<void> {
  console.log('[CRON] Initializing cron jobs...');

  // Phase 2: Booking jobs
  const { send24HourReminders, send1HourReminders } = await import('./booking/booking-reminders.job');
  const { detectNoShows } = await import('./booking/no-show-detection.job');
  const { send24HourReminders: sendAppointmentReminders, sendReviewReminders } = await import('./booking/notifications.job');

  // Phase 3: Subscription jobs
  const { sendSubscriptionWarnings, disableExpiredSubscriptions } = await import('./subscription/subscription-management.job');

  // Register booking reminder jobs
  registerJob(
    'booking-reminders-24h',
    cronConfig.bookingReminders.twentyFourHour.schedule,
    send24HourReminders,
    cronConfig.bookingReminders.twentyFourHour.enabled
  );

  registerJob(
    'booking-reminders-1h',
    cronConfig.bookingReminders.oneHour.schedule,
    send1HourReminders,
    cronConfig.bookingReminders.oneHour.enabled
  );

  // Register notification jobs
  registerJob(
    'appointment-reminders',
    cronConfig.notifications.appointmentReminders.schedule,
    sendAppointmentReminders,
    cronConfig.notifications.appointmentReminders.enabled
  );

  registerJob(
    'review-reminders',
    cronConfig.notifications.reviewReminders.schedule,
    sendReviewReminders,
    cronConfig.notifications.reviewReminders.enabled
  );

  // Register no-show detection job
  registerJob(
    'no-show-detection',
    cronConfig.noShowDetection.schedule,
    detectNoShows,
    cronConfig.noShowDetection.enabled
  );

  // ==================== Phase 2: Unpaid Bookings Management ====================
  const { sendPaymentReminders, autoCancelUnpaidBookings } = await import('./booking/unpaid-bookings.job');
  const { autoDeclineUnconfirmedBookings } = await import('./booking/auto-decline-unconfirmed.job');
  const { autoCancelUnpaidBalance } = await import('./booking/auto-cancel-unpaid-balance.job');

  // Payment reminders (2 hours after booking)
  registerJob(
    'payment-reminders',
    cronConfig.unpaidBookings.paymentReminders.schedule,
    sendPaymentReminders,
    cronConfig.unpaidBookings.paymentReminders.enabled
  );

  // Auto-cancel unpaid bookings (24 hours after booking)
  registerJob(
    'auto-cancel-unpaid',
    cronConfig.unpaidBookings.autoCancel.schedule,
    autoCancelUnpaidBookings,
    cronConfig.unpaidBookings.autoCancel.enabled
  );

  // Auto-decline unconfirmed bookings (48 hours after booking)
  registerJob(
    'auto-decline-unconfirmed',
    '0 */6 * * *', // Every 6 hours
    autoDeclineUnconfirmedBookings,
    true
  );

  // Auto-cancel unpaid balance (24 hours after appointment)
  registerJob(
    'auto-cancel-unpaid-balance',
    '0 */6 * * *', // Every 6 hours
    autoCancelUnpaidBalance,
    true
  );

  // ==================== Phase 3: Subscription Management ====================
  
  // Subscription expiry warnings
  registerJob(
    'subscription-warnings',
    cronConfig.subscription.warnings.schedule,
    sendSubscriptionWarnings,
    cronConfig.subscription.warnings.enabled
  );

  // Auto-disable expired subscriptions
  registerJob(
    'subscription-expiry',
    cronConfig.subscription.expiry.schedule,
    disableExpiredSubscriptions,
    cronConfig.subscription.expiry.enabled
  );

  // Phase 4: User engagement jobs (will be added)
  // Phase 5: Analytics jobs (will be added)
  // Phase 6: Maintenance jobs (will be added)

  console.log('[CRON] Job registration complete');

  // Start all jobs if enabled
  if (cronConfig.enabled) {
    startAllJobs();
  }
}

export default {
  registerJob,
  startAllJobs,
  stopAllJobs,
  getJobStatus,
  getAllJobStatuses,
  initializeCronJobs,
};
