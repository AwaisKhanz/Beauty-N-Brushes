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
export * from './team.types';

// Error Types
export * from './error.types';

// Dashboard Types
export * from './dashboard.types';

// Calendar Types
export * from './calendar.types';

// Inspiration Types
export * from './inspiration.types';

// Settings Types
export * from './settings.types';

// Location Types
export * from './location.types';

// Team Types
export * from './team.types';

// Booking Types
export * from './booking.types';

// Review Types
export * from './review.types';
export type { ReviewWithRelations, GetMyReviewsResponse } from './review.types';

// Like Types
export * from './like.types';

// Favorite Types
export * from './favorite.types';

// Message Types
export * from './message.types';
export * from './notification.types';

// Saved Search Types
export * from './savedSearch.types';

// User Profile Types
export * from './user.types';

// Instagram Integration Types
export * from './instagram.types';

// Provider Management Types
export * from './provider.types';

// Finance Types
export * from './finance.types';

// AI Messaging Types
export * from './ai-messaging.types';

// Analytics Types
export * from './analytics.types';

// Client Management Types
export * from './client-management.types';

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
