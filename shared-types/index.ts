/**
 * Shared Types Index
 * Export all shared types for easy importing
 */

// Auth Types
export * from './auth.types';

// Onboarding Types
export * from './onboarding.types';

// Service Types
export * from './service.types';

// Upload Types
export * from './upload.types';

// Payment Types
export * from './payment.types';

// Webhook Types
export * from './webhook.types';

// Error Types
export * from './error.types';

// Dashboard Types
export * from './dashboard.types';

// Calendar Types
export * from './calendar.types';

// Common Response Type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
