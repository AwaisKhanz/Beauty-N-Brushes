/**
 * Job Logger Utility
 * Provides structured logging for cron jobs
 */

import { format } from 'date-fns';

export interface JobLog {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'failed' | 'partial';
  itemsProcessed: number;
  errors: string[];
  metadata?: any;
}

class JobLogger {
  private logs: Map<string, JobLog> = new Map();

  /**
   * Start logging a job execution
   */
  start(jobName: string): void {
    const log: JobLog = {
      jobName,
      startTime: new Date(),
      status: 'running',
      itemsProcessed: 0,
      errors: [],
    };

    this.logs.set(jobName, log);
    console.log(`[CRON] ${jobName} started at ${format(log.startTime, 'yyyy-MM-dd HH:mm:ss')}`);
  }

  /**
   * Log successful completion
   */
  success(jobName: string, itemsProcessed: number, metadata?: any): void {
    const log = this.logs.get(jobName);
    if (!log) return;

    log.endTime = new Date();
    log.status = 'success';
    log.itemsProcessed = itemsProcessed;
    log.metadata = metadata;

    const duration = log.endTime.getTime() - log.startTime.getTime();
    console.log(
      `[CRON] ${jobName} completed successfully in ${duration}ms - Processed: ${itemsProcessed} items`
    );

    if (metadata) {
      console.log(`[CRON] ${jobName} metadata:`, JSON.stringify(metadata, null, 2));
    }
  }

  /**
   * Log failure
   */
  error(jobName: string, error: Error | string, itemsProcessed: number = 0): void {
    const log = this.logs.get(jobName);
    if (!log) return;

    log.endTime = new Date();
    log.status = 'failed';
    log.itemsProcessed = itemsProcessed;
    log.errors.push(error instanceof Error ? error.message : error);

    const duration = log.endTime.getTime() - log.startTime.getTime();
    console.error(
      `[CRON] ${jobName} failed after ${duration}ms - Error: ${error instanceof Error ? error.message : error}`
    );

    if (error instanceof Error && error.stack) {
      console.error(`[CRON] ${jobName} stack trace:`, error.stack);
    }
  }

  /**
   * Log partial success (some items processed, some failed)
   */
  partial(jobName: string, itemsProcessed: number, errors: string[], metadata?: any): void {
    const log = this.logs.get(jobName);
    if (!log) return;

    log.endTime = new Date();
    log.status = 'partial';
    log.itemsProcessed = itemsProcessed;
    log.errors = errors;
    log.metadata = metadata;

    const duration = log.endTime.getTime() - log.startTime.getTime();
    console.warn(
      `[CRON] ${jobName} completed with errors in ${duration}ms - Processed: ${itemsProcessed}, Errors: ${errors.length}`
    );

    errors.forEach((err, idx) => {
      console.warn(`[CRON] ${jobName} error ${idx + 1}:`, err);
    });
  }

  /**
   * Get job log
   */
  getLog(jobName: string): JobLog | undefined {
    return this.logs.get(jobName);
  }

  /**
   * Get all logs
   */
  getAllLogs(): JobLog[] {
    return Array.from(this.logs.values());
  }

  /**
   * Clear old logs (keep last 100)
   */
  cleanup(): void {
    const logs = Array.from(this.logs.entries());
    if (logs.length > 100) {
      const toRemove = logs.slice(0, logs.length - 100);
      toRemove.forEach(([key]) => this.logs.delete(key));
    }
  }
}

// Singleton instance
export const jobLogger = new JobLogger();

export default jobLogger;
