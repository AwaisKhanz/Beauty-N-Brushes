import { prisma as db } from '../config/database';
import { NotificationType } from '../../../shared-types';
import { emitNotification } from '../config/socket.server';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData) {
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        notificationType: data.type,
        title: data.title,
        body: data.message,
        actionUrl: data.data?.actionUrl,
        relatedBookingId: data.data?.bookingId,
        isRead: false,
      },
    });

    const formattedNotification = {
      id: notification.id,
      userId: notification.userId,
      type: notification.notificationType as NotificationType,
      title: notification.title,
      message: notification.body,
      data: {
        actionUrl: notification.actionUrl,
        bookingId: notification.relatedBookingId,
        ...data.data,
      },
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() || null,
    };

    // Emit Socket.IO event for real-time notification
    emitNotification(data.userId, formattedNotification);

    return formattedNotification;
  }

  /**
   * Create notification for new message
   */
  async createMessageNotification(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string,
    senderId: string
  ) {
    return this.createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: `New message from ${senderName}`,
      message: messagePreview.substring(0, 100),
      data: {
        actionUrl: `/messages?conversation=${conversationId}`,
        conversationId,
        senderId, // Add sender ID for context checking
      },
    });
  }

  // ================================
  // Booking Notifications
  // ================================

  /**
   * Create notification for new booking
   */
  async createBookingCreatedNotification(
    providerId: string,
    clientName: string,
    serviceName: string,
    date: string,
    time: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'BOOKING_CREATED',
      title: 'New Booking Request',
      message: `${clientName} booked ${serviceName} for ${date} at ${time}`,
      data: {
        actionUrl: `/provider/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for booking confirmation
   */
  async createBookingConfirmedNotification(
    clientId: string,
    providerName: string,
    date: string,
    time: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: clientId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed!',
      message: `Your booking with ${providerName} is confirmed for ${date} at ${time}`,
      data: {
        actionUrl: `/client/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for booking cancellation
   */
  async createBookingCancelledNotification(
    recipientId: string,
    cancellerName: string,
    date: string,
    bookingId: string,
    isProvider: boolean
  ) {
    return this.createNotification({
      userId: recipientId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `${cancellerName} cancelled the booking for ${date}`,
      data: {
        actionUrl: isProvider ? `/provider/bookings/${bookingId}` : `/client/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for booking rescheduled
   */
  async createBookingRescheduledNotification(
    recipientId: string,
    newDate: string,
    newTime: string,
    bookingId: string,
    isProvider: boolean
  ) {
    return this.createNotification({
      userId: recipientId,
      type: 'BOOKING_RESCHEDULED',
      title: 'Booking Rescheduled',
      message: `Booking moved to ${newDate} at ${newTime}`,
      data: {
        actionUrl: isProvider ? `/provider/bookings/${bookingId}` : `/client/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for reschedule request
   */
  async createRescheduleRequestNotification(
    clientId: string,
    providerName: string,
    proposedDate: string,
    proposedTime: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: clientId,
      type: 'RESCHEDULE_REQUESTED',
      title: 'Reschedule Request',
      message: `${providerName} requested to reschedule to ${proposedDate} at ${proposedTime}`,
      data: {
        actionUrl: `/client/bookings/${bookingId}/reschedule-request`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for reschedule approval
   */
  async createRescheduleApprovedNotification(
    providerId: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'RESCHEDULE_APPROVED',
      title: 'Reschedule Approved',
      message: 'Client approved your reschedule request',
      data: {
        actionUrl: `/provider/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for reschedule rejection
   */
  async createRescheduleRejectedNotification(
    providerId: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'RESCHEDULE_REJECTED',
      title: 'Reschedule Rejected',
      message: 'Client rejected your reschedule request',
      data: {
        actionUrl: `/provider/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for booking completion
   */
  async createBookingCompletedNotification(
    clientId: string,
    providerName: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: clientId,
      type: 'BOOKING_COMPLETED',
      title: 'Appointment Complete!',
      message: `How was your experience? Leave a review for ${providerName}`,
      data: {
        actionUrl: `/client/bookings/${bookingId}/review`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for team member assignment
   */
  async createTeamMemberAssignedNotification(
    teamMemberId: string,
    clientName: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: teamMemberId,
      type: 'BOOKING_ASSIGNED_TO_YOU',
      title: 'New Assignment',
      message: `You've been assigned to ${clientName}'s booking`,
      data: {
        actionUrl: `/provider/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for stylist assignment (to client)
   */
  async createStylistAssignedNotification(
    clientId: string,
    stylistName: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: clientId,
      type: 'TEAM_MEMBER_ASSIGNED',
      title: 'Stylist Assigned',
      message: `${stylistName} will be your stylist`,
      data: {
        actionUrl: `/client/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Create notification for booking photo added
   */
  async createBookingPhotoAddedNotification(
    recipientId: string,
    uploaderName: string,
    photoType: string,
    bookingId: string,
    isProvider: boolean
  ) {
    return this.createNotification({
      userId: recipientId,
      type: 'BOOKING_PHOTO_ADDED',
      title: 'New Photo Added',
      message: `${uploaderName} added a ${photoType.toLowerCase()} photo to your booking`,
      data: {
        actionUrl: isProvider ? `/provider/bookings/${bookingId}` : `/client/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.notificationType as NotificationType,
        title: n.title,
        message: n.body,
        data: {
          actionUrl: n.actionUrl,
          bookingId: n.relatedBookingId,
        },
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() || null,
      })),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string) {
    const notifications = await db.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.notificationType as NotificationType,
      title: n.title,
      message: n.body,
      data: {
        actionUrl: n.actionUrl,
        bookingId: n.relatedBookingId,
      },
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString() || null,
    }));
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await db.notification.update({
      where: { 
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.notificationType as NotificationType,
      title: notification.title,
      message: notification.body,
      data: {
        actionUrl: notification.actionUrl,
        bookingId: notification.relatedBookingId,
      },
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() || null,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    await db.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
    });
  }

  /**
   * Delete old read notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.notification.deleteMany({
      where: {
        isRead: true,
        readAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  // ==================== Booking Notifications ====================

  /**
   * Create notification for booking reminder
   */
  async createBookingReminderNotification(
    userId: string,
    otherPartyName: string,
    bookingId: string,
    appointmentDate: string,
    appointmentTime: string
  ) {
    return this.createNotification({
      userId,
      type: 'BOOKING_REMINDER',
      title: 'Upcoming Appointment Reminder',
      message: `Reminder: You have an appointment with ${otherPartyName} on ${appointmentDate} at ${appointmentTime}`,
      data: {
        actionUrl: `/bookings/${bookingId}`,
        bookingId,
        appointmentDate,
        appointmentTime,
      },
    });
  }

  /**
   * Create notification for no-show
   */
  async createBookingNoShowNotification(
    userId: string,
    otherPartyName: string,
    bookingId: string,
    appointmentDate: string
  ) {
    return this.createNotification({
      userId,
      type: 'BOOKING_NO_SHOW',
      title: 'Missed Appointment',
      message: `You were marked as no-show for your appointment with ${otherPartyName} on ${appointmentDate}`,
      data: {
        actionUrl: `/bookings/${bookingId}`,
        bookingId,
      },
    });
  }

  // ==================== Review Notifications ====================

  async createReviewReceivedNotification(
    providerId: string,
    clientName: string,
    rating: number,
    serviceName: string,
    reviewId: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review Received',
      message: `${clientName} left a ${rating}-star review for ${serviceName}`,
      data: {
        actionUrl: `/provider/reviews/${reviewId}`,
        reviewId,
        rating,
      },
    });
  }

  async createReviewResponseNotification(
    clientId: string,
    providerName: string,
    reviewId: string
  ) {
    return this.createNotification({
      userId: clientId,
      type: 'REVIEW_RESPONSE_RECEIVED',
      title: 'Provider Responded to Your Review',
      message: `${providerName} responded to your review`,
      data: {
        actionUrl: `/client/reviews/${reviewId}`,
        reviewId,
      },
    });
  }

  async createReviewHelpfulNotification(
    reviewAuthorId: string,
    reviewId: string
  ) {
    return this.createNotification({
      userId: reviewAuthorId,
      type: 'REVIEW_HELPFUL',
      title: 'Review Marked Helpful',
      message: 'Someone found your review helpful!',
      data: {
        actionUrl: `/client/reviews/${reviewId}`,
        reviewId,
      },
    });
  }

  async createReviewMilestoneNotification(
    providerId: string,
    milestoneCount: number,
    averageRating: number
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'REVIEW_MILESTONE',
      title: `🎉 ${milestoneCount} Reviews Milestone!`,
      message: `Congratulations! You've reached ${milestoneCount} reviews with an average rating of ${averageRating.toFixed(1)} stars`,
      data: {
        actionUrl: '/provider/reviews',
        milestoneCount,
        averageRating,
      },
    });
  }

  // ==================== Like Notifications ====================

  async createProviderLikedNotification(
    providerId: string,
    likeCount: number,
    totalLikes: number
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'PROVIDER_LIKED',
      title: `${likeCount} New ${likeCount === 1 ? 'Like' : 'Likes'}!`,
      message: `You received ${likeCount} new ${likeCount === 1 ? 'like' : 'likes'}. Total: ${totalLikes}`,
      data: {
        actionUrl: '/provider/analytics',
        likeCount,
        totalLikes,
      },
    });
  }

  async createServiceLikedNotification(
    providerId: string,
    serviceName: string,
    likeCount: number,
    serviceId: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'SERVICE_LIKED',
      title: 'Service Liked!',
      message: `${serviceName} received ${likeCount} new ${likeCount === 1 ? 'like' : 'likes'}`,
      data: {
        actionUrl: `/provider/services/${serviceId}`,
        serviceId,
        likeCount,
      },
    });
  }

  // ==================== Team Notifications ====================

  async createTeamMemberJoinedNotification(
    providerId: string,
    memberName: string,
    role: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'TEAM_MEMBER_JOINED',
      title: 'New Team Member! 👥',
      message: `${memberName} joined your team as ${role}`,
      data: {
        actionUrl: '/provider/settings/team',
        memberName,
        role,
      },
    });
  }

  async createTeamMemberRemovedNotification(
    userId: string,
    providerName: string,
    reason?: string
  ) {
    return this.createNotification({
      userId,
      type: 'TEAM_MEMBER_REMOVED',
      title: 'Removed from Team',
      message: `You were removed from ${providerName}'s team${reason ? `: ${reason}` : ''}`,
      data: {
        providerName,
        reason,
      },
    });
  }

  async createTeamRoleChangedNotification(
    userId: string,
    oldRole: string,
    newRole: string,
    providerName: string
  ) {
    return this.createNotification({
      userId,
      type: 'TEAM_ROLE_CHANGED',
      title: 'Role Updated',
      message: `Your role changed from ${oldRole} to ${newRole} at ${providerName}`,
      data: {
        actionUrl: '/provider/settings/team',
        oldRole,
        newRole,
      },
    });
  }

  // ==================== Service Notifications ====================

  async createServicePublishedNotification(
    providerId: string,
    serviceName: string,
    serviceId: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'SERVICE_PUBLISHED',
      title: 'Service Published! 🎉',
      message: `${serviceName} is now live and accepting bookings`,
      data: {
        actionUrl: `/provider/services/${serviceId}`,
        serviceId,
      },
    });
  }

  async createServiceFeaturedNotification(
    providerId: string,
    serviceName: string,
    featuredUntil: Date
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'SERVICE_FEATURED',
      title: 'Service Featured! ⭐',
      message: `${serviceName} is featured until ${featuredUntil.toLocaleDateString()}`,
      data: {
        actionUrl: '/provider/services',
        featuredUntil: featuredUntil.toISOString(),
      },
    });
  }

  async createServiceTrendingNotification(
    providerId: string,
    serviceName: string,
    viewCount: number,
    bookingCount: number
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'SERVICE_TRENDING',
      title: 'Service Trending! 🔥',
      message: `${serviceName} is trending with ${viewCount} views and ${bookingCount} bookings`,
      data: {
        actionUrl: '/provider/analytics',
        viewCount,
        bookingCount,
      },
    });
  }

  // ==================== Subscription Notifications ====================

  /**
   * Create notification for subscription expiring soon
   */
  async createSubscriptionExpiringNotification(
    userId: string,
    expiryDate: Date,
    daysRemaining: number
  ) {
    const urgency = daysRemaining === 1 ? 'URGENT: ' : '';
    const formattedDate = expiryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return this.createNotification({
      userId,
      type: 'SUBSCRIPTION_EXPIRING',
      title: `${urgency}Subscription Expiring Soon`,
      message: `Your subscription will expire in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} on ${formattedDate}. Renew now to avoid service interruption.`,
      data: {
        actionUrl: '/provider/subscription',
        expiryDate: expiryDate.toISOString(),
        daysRemaining,
      },
    });
  }

  /**
   * Create notification for expired subscription
   */
  async createSubscriptionExpiredNotification(
    userId: string,
    previousTier: string
  ) {
    return this.createNotification({
      userId,
      type: 'SUBSCRIPTION_EXPIRED',
      title: 'Subscription Expired',
      message: `Your ${previousTier} subscription has expired. Your account has been downgraded to the FREE tier. Renew now to restore your services.`,
      data: {
        actionUrl: '/provider/subscription',
        previousTier,
      },
    });
  }

  // ==================== System Notifications ====================

  async createAccountVerifiedNotification(providerId: string) {
    return this.createNotification({
      userId: providerId,
      type: 'ACCOUNT_VERIFIED',
      title: 'Account Verified! ✓',
      message: 'Your account is now verified. Enjoy increased visibility!',
      data: {
        actionUrl: '/provider/dashboard',
      },
    });
  }

  async createPaymentReceivedNotification(
    providerId: string,
    amount: number,
    clientName: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received! 💰',
      message: `Received $${amount.toFixed(2)} from ${clientName}`,
      data: {
        actionUrl: `/provider/bookings/${bookingId}`,
        amount,
        bookingId,
      },
    });
  }

  async createProfileCompletionReminderNotification(
    providerId: string,
    completionPercentage: number,
    missingItems: string[]
  ) {
    return this.createNotification({
      userId: providerId,
      type: 'PROFILE_COMPLETION_REMINDER',
      title: 'Complete Your Profile',
      message: `Your profile is ${completionPercentage}% complete. Add: ${missingItems.join(', ')}`,
      data: {
        actionUrl: '/provider/onboarding',
        completionPercentage,
        missingItems,
      },
    });
  }
}

// Export singleton instance for backward compatibility
export const notificationService = new NotificationService();
