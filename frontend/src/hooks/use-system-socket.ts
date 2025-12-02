/**
 * useSystemSocket Hook
 * Handles real-time service and system notifications via Socket.IO
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SystemSocketData {
  type: string;
  serviceName?: string;
  serviceId?: string;
  viewCount?: number;
  bookingCount?: number;
  amount?: number;
  clientName?: string;
  bookingId?: string;
  expiryDate?: string;
  completionPercentage?: number;
  missingItems?: string[];
  timestamp?: string;
}

export function useSystemSocket() {
  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle service published event
  const handleServicePublished = useCallback((data: SystemSocketData) => {
    toast({
      title: 'Service Published! 🎉',
      description: `${data.serviceName} is now live and accepting bookings`,
      variant: 'default',
    });

    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
  }, [toast, queryClient]);

  // Handle service featured event
  const handleServiceFeatured = useCallback((data: SystemSocketData) => {
    toast({
      title: 'Service Featured! ⭐',
      description: `${data.serviceName} is now featured`,
      variant: 'default',
    });

    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['service', data.serviceId] });
  }, [toast, queryClient]);

  // Handle service trending event
  const handleServiceTrending = useCallback((data: SystemSocketData) => {
    toast({
      title: 'Service Trending! 🔥',
      description: `${data.serviceName} - ${data.viewCount} views, ${data.bookingCount} bookings`,
      variant: 'default',
    });

    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
  }, [toast, queryClient]);

  // Handle account verified event
  const handleAccountVerified = useCallback(() => {
    toast({
      title: 'Account Verified! ✓',
      description: 'Your account is now verified. Enjoy increased visibility!',
      variant: 'default',
    });

    queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
  }, [toast, queryClient]);

  // Handle payment received event
  const handlePaymentReceived = useCallback((data: SystemSocketData) => {
    toast({
      title: 'Payment Received! 💰',
      description: `$${data.amount?.toFixed(2)} from ${data.clientName}`,
      variant: 'default',
    });

    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
    queryClient.invalidateQueries({ queryKey: ['booking', data.bookingId] });
  }, [toast, queryClient]);

  // Handle subscription expiring event
  const handleSubscriptionExpiring = useCallback((data: SystemSocketData) => {
    const expiryDate = data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : '';
    toast({
      title: 'Subscription Expiring Soon',
      description: `Renew before ${expiryDate} to continue service`,
      variant: 'destructive',
    });
  }, [toast]);

  // Handle profile completion reminder event
  const handleProfileCompletionReminder = useCallback((data: SystemSocketData) => {
    toast({
      title: 'Complete Your Profile',
      description: `${data.completionPercentage}% complete. Missing: ${data.missingItems?.slice(0, 2).join(', ')}`,
      variant: 'default',
    });
  }, [toast]);

  // Set up Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    // Register all event listeners
    socket.on('service_published', handleServicePublished);
    socket.on('service_featured', handleServiceFeatured);
    socket.on('service_trending', handleServiceTrending);
    socket.on('account_verified', handleAccountVerified);
    socket.on('payment_received', handlePaymentReceived);
    socket.on('subscription_expiring', handleSubscriptionExpiring);
    socket.on('profile_completion_reminder', handleProfileCompletionReminder);

    // Cleanup listeners on unmount
    return () => {
      socket.off('service_published', handleServicePublished);
      socket.off('service_featured', handleServiceFeatured);
      socket.off('service_trending', handleServiceTrending);
      socket.off('account_verified', handleAccountVerified);
      socket.off('payment_received', handlePaymentReceived);
      socket.off('subscription_expiring', handleSubscriptionExpiring);
      socket.off('profile_completion_reminder', handleProfileCompletionReminder);
    };
  }, [
    socket,
    handleServicePublished,
    handleServiceFeatured,
    handleServiceTrending,
    handleAccountVerified,
    handlePaymentReceived,
    handleSubscriptionExpiring,
    handleProfileCompletionReminder,
  ]);

  return {
    // Hook doesn't need to return anything
    // It just sets up listeners and handles events
  };
}
