/**
 * Job Helper Utilities
 * Shared utility functions for cron jobs
 */

import { addHours, addMinutes, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

/**
 * Get date range for a specific number of hours from now
 */
export function getHoursFromNow(hours: number): { start: Date; end: Date } {
  const now = new Date();
  const targetTime = addHours(now, hours);

  // 5-minute window for matching
  const start = addMinutes(targetTime, -2);
  const end = addMinutes(targetTime, 3);

  return { start, end };
}

/**
 * Get date range for a specific number of minutes from now
 */
export function getMinutesFromNow(minutes: number): { start: Date; end: Date } {
  const now = new Date();
  const targetTime = addMinutes(now, minutes);

  // 2-minute window for matching
  const start = addMinutes(targetTime, -1);
  const end = addMinutes(targetTime, 1);

  return { start, end };
}

/**
 * Get date range for items older than X days
 */
export function getOlderThan(days: number): Date {
  return subDays(new Date(), days);
}

/**
 * Get date range for items older than X months
 */
export function getOlderThanMonths(months: number): Date {
  return subMonths(new Date(), months);
}

/**
 * Get start and end of today
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

/**
 * Combine date and time strings into a Date object
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const date = new Date(dateStr);
  const [hours, minutes] = timeStr.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Check if a date/time is in the past (with grace period)
 */
export function isPastWithGrace(date: Date, gracePeriodMinutes: number): boolean {
  const now = new Date();
  const dateWithGrace = addMinutes(date, gracePeriodMinutes);
  return now > dateWithGrace;
}

/**
 * Batch process items with error handling
 */
export async function batchProcess<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  batchSize: number = 10
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (item) => {
        try {
          await processor(item);
          processed++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(errorMsg);
        }
      })
    );
  }

  return { processed, errors };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export default {
  getHoursFromNow,
  getMinutesFromNow,
  getOlderThan,
  getOlderThanMonths,
  getTodayRange,
  combineDateAndTime,
  isPastWithGrace,
  batchProcess,
  retryWithBackoff,
  formatDuration,
  chunkArray,
};
