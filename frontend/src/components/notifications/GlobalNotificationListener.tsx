'use client';

import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Notification } from '../../../../shared-types';

/**
 * Global notification listener component
 * This component listens for Socket.IO notification events and shows toasts
 * It should be included in the root layout to work across all pages
 */
export function GlobalNotificationListener() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!socket || !user) return;

    // Track shown notifications to prevent duplicates
    const shownNotifications = new Set<string>();

    const handleNewNotification = (notification: Notification) => {
      console.log('[GlobalNotificationListener] Received notification:', notification);
      
      // Prevent duplicate notifications
      if (shownNotifications.has(notification.id)) {
        console.log('[GlobalNotificationListener] Skipping duplicate notification:', notification.id);
        return;
      }
      
      // Mark as shown
      shownNotifications.add(notification.id);
      
      // Show toast notification
      // Backend already checks if user is viewing the conversation, so we always show the toast here
      toast(notification.title, {
        description: notification.message,
        action: {
          label: 'View',
          onClick: () => {
            // Handle navigation based on notification type and user role
            if (notification.type === 'NEW_MESSAGE') {
              const basePath = user.role === 'CLIENT' ? '/client' : '/provider';
              const senderId = notification.data.senderId;
              router.push(`${basePath}/messages?conversation=${senderId}`);
            } else if (notification.type === 'BOOKING_CONFIRMED' || notification.type === 'BOOKING_CANCELLED') {
              const basePath = user.role === 'CLIENT' ? '/client' : '/provider';
              router.push(`${basePath}/bookings/${notification.data.bookingId}`);
            }
            // Add more notification types as needed
          },
        },
      });
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
      shownNotifications.clear();
    };
  }, [socket, user, router]);

  // This component doesn't render anything
  return null;
}
