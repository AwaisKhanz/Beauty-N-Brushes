/**
 * Notification Types
 * Types for in-app notification system
 */

// ================================
// Notification Types
// ================================

export type NotificationType = 
  // Messaging (✅ IMPLEMENTED)
  | 'NEW_MESSAGE'
  
  // Booking Notifications (Phase 1)
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_NO_SHOW'
  | 'BOOKING_REMINDER'              // 24h before appointment
  | 'BOOKING_PHOTO_ADDED'
  | 'RESCHEDULE_REQUESTED'
  | 'RESCHEDULE_APPROVED'
  | 'RESCHEDULE_REJECTED'
  | 'TEAM_MEMBER_ASSIGNED'
  | 'BOOKING_ASSIGNED_TO_YOU'
  
  // Review Notifications (Phase 2)
  | 'REVIEW_RECEIVED'
  | 'REVIEW_RESPONSE_RECEIVED'
  | 'REVIEW_HELPFUL'
  | 'REVIEW_MILESTONE'              // e.g., 10th, 50th review
  
  // Like Notifications (Phase 3)
  | 'PROVIDER_LIKED'
  | 'SERVICE_LIKED'
  | 'LIKE_MILESTONE'                // e.g., 100 likes
  
  // Team Notifications (Phase 4)
  | 'TEAM_MEMBER_INVITED'
  | 'TEAM_MEMBER_JOINED'
  | 'TEAM_MEMBER_REMOVED'
  | 'TEAM_ROLE_CHANGED'
  
  // Service Notifications (Phase 5)
  | 'SERVICE_PUBLISHED'
  | 'SERVICE_FEATURED'
  | 'SERVICE_TRENDING'
  
  // System Notifications (Phase 6)
  | 'ACCOUNT_VERIFIED'
  | 'PROFILE_COMPLETION_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'PAYOUT_PROCESSED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED'
  
  // Client Management (Phase 6)
  | 'CLIENT_NOTE_ADDED'
  | 'CLIENT_BIRTHDAY_REMINDER'
  
  // Onboarding & Settings (Phase 7)
  | 'PROFILE_APPROVED'
  | 'PROFILE_VERIFICATION_REQUIRED'
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

// ================================
// Request Types
// ================================

export interface GetNotificationsRequest {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface MarkNotificationAsReadRequest {
  notificationId: string;
}

// ================================
// Response Types
// ================================

export interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MarkAsReadResponse {
  message: string;
  notification: Notification;
}

export interface MarkAllAsReadResponse {
  message: string;
  count: number;
}

export interface GetUnreadCountResponse {
  unreadCount: number;
}
