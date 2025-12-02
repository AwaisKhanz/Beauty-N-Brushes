/**
 * Job Error Handler
 * Centralized error handling for cron jobs
 */

import { jobLogger } from './logger';

export class JobError extends Error {
  constructor(
    message: string,
    public jobName: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'JobError';
  }
}

/**
 * Wrap a job function with error handling
 */
export function withErrorHandling<T extends any[]>(
  jobName: string,
  fn: (...args: T) => Promise<void>
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      jobLogger.start(jobName);
      await fn(...args);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      jobLogger.error(jobName, errorMsg);

      // Log to external monitoring service if configured
      if (process.env.SENTRY_DSN) {
        // TODO: Send to Sentry or other monitoring service
        console.error(`[MONITORING] Job ${jobName} failed:`, error);
      }

      // Don't throw - we don't want to crash the cron scheduler
      // Just log the error and continue
    }
  };
}

/**
 * Handle individual item errors in batch processing
 */
export function handleItemError(
  jobName: string,
  itemId: string,
  error: Error | string
): void {
  const errorMsg = error instanceof Error ? error.message : error;
  console.error(`[CRON] ${jobName} - Error processing item ${itemId}:`, errorMsg);
}

/**
 * Create a safe job wrapper that catches all errors
 */
export function safeJob(jobName: string, fn: () => Promise<void>): () => Promise<void> {
  return withErrorHandling(jobName, fn);
}

export default {
  JobError,
  withErrorHandling,
  handleItemError,
  safeJob,
};
