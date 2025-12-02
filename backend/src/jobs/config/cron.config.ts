/**
 * Cron Job Configuration
 * Centralized configuration for all scheduled jobs
 */

export const cronConfig = {
  // Global settings
  enabled: process.env.ENABLE_CRON_JOBS === 'true',
  timezone: process.env.CRON_TIMEZONE || 'UTC',

  // Booking reminders
  bookingReminders: {
    twentyFourHour: {
      enabled: process.env.BOOKING_REMINDER_24H_ENABLED !== 'false',
      schedule: '0 * * * *', // Every hour at :00
    },
    oneHour: {
      enabled: process.env.BOOKING_REMINDER_1H_ENABLED !== 'false',
      schedule: '*/15 * * * *', // Every 15 minutes
    },
  },

  // No-show detection
  noShowDetection: {
    enabled: true,
    schedule: '30 * * * *', // Every hour at :30
    gracePeriodMinutes: parseInt(process.env.NO_SHOW_GRACE_PERIOD_MINUTES || '30'),
  },

  // Subscription management
  subscription: {
    warnings: {
      enabled: true,
      schedule: '0 9 * * *', // Daily at 9 AM
      warningDays: process.env.SUBSCRIPTION_WARNING_DAYS?.split(',').map(Number) || [7, 3, 1],
    },
    expiry: {
      enabled: process.env.AUTO_DISABLE_EXPIRED !== 'false',
      schedule: '0 0 * * *', // Daily at midnight
    },
  },

  // User engagement
  userEngagement: {
    profileCompletion: {
      enabled: true,
      schedule: '0 10 * * *', // Daily at 10 AM
      minDaysSinceCreation: 3,
      reminderIntervalDays: 7,
    },
    reengagement: {
      enabled: true,
      schedule: '0 10 * * 1', // Weekly on Monday at 10 AM
      inactiveDays: 30,
    },
  },

  // Analytics
  analytics: {
    enabled: process.env.ENABLE_ANALYTICS_JOBS !== 'false',
    daily: {
      schedule: '0 1 * * *', // Daily at 1 AM
    },
    trending: {
      schedule: '0 2 * * *', // Daily at 2 AM
      minViews: parseInt(process.env.TRENDING_MIN_VIEWS || '100'),
      minBookings: parseInt(process.env.TRENDING_MIN_BOOKINGS || '10'),
    },
    performance: {
      schedule: '0 23 * * 0', // Weekly on Sunday at 11 PM
    },
  },

  // Maintenance & cleanup
  maintenance: {
    notificationCleanup: {
      enabled: true,
      schedule: '0 3 * * *', // Daily at 3 AM
      retentionDays: parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '90'),
    },
    bookingArchive: {
      enabled: true,
      schedule: '0 4 1 * *', // Monthly on 1st at 4 AM
      archiveMonths: parseInt(process.env.BOOKING_ARCHIVE_MONTHS || '12'),
    },
    sessionCleanup: {
      enabled: true,
      schedule: '0 5 * * *', // Daily at 5 AM
      retentionDays: parseInt(process.env.SESSION_RETENTION_DAYS || '30'),
    },
  },
};

export default cronConfig;
