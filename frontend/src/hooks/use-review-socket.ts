/**
 * useReviewSocket Hook
 * Handles real-time review updates via Socket.IO
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ReviewSocketData {
  type: string;
  review?: {
    id: string;
    [key: string]: any;
  };
  milestone?: {
    count: number;
    avgRating: number;
  };
  timestamp?: string;
}

export function useReviewSocket() {
  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle review received event
  const handleReviewReceived = useCallback((data: ReviewSocketData) => {
    toast({
      title: 'New Review Received! ⭐',
      description: `${data.review?.clientName} left a ${data.review?.rating}-star review`,
      variant: 'default',
    });

    // Invalidate reviews query to refresh list
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
  }, [toast, queryClient]);

  // Handle provider response event
  const handleReviewResponse = useCallback((data: ReviewSocketData) => {
    toast({
      title: 'Provider Responded',
      description: `${data.review?.providerName} responded to your review`,
      variant: 'default',
    });

    // Invalidate reviews query
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['review', data.review?.id] });
  }, [toast, queryClient]);

  // Handle review marked helpful event
  const handleReviewHelpful = useCallback((data: ReviewSocketData) => {
    toast({
      title: 'Review Helpful! 👍',
      description: 'Someone found your review helpful',
      variant: 'default',
    });

    // Invalidate reviews query
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['review', data.review?.id] });
  }, [toast, queryClient]);

  // Handle review milestone event
  const handleReviewMilestone = useCallback((data: ReviewSocketData) => {
    toast({
      title: `🎉 ${data.milestone?.count} Reviews Milestone!`,
      description: `Congratulations! Average rating: ${data.milestone?.avgRating?.toFixed(1)} stars`,
      variant: 'default',
    });

    // Invalidate reviews and stats queries
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
  }, [toast, queryClient]);

  // Set up Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    // Register all event listeners
    socket.on('review_received', handleReviewReceived);
    socket.on('review_response_received', handleReviewResponse);
    socket.on('review_marked_helpful', handleReviewHelpful);
    socket.on('review_milestone', handleReviewMilestone);

    // Cleanup listeners on unmount
    return () => {
      socket.off('review_received', handleReviewReceived);
      socket.off('review_response_received', handleReviewResponse);
      socket.off('review_marked_helpful', handleReviewHelpful);
      socket.off('review_milestone', handleReviewMilestone);
    };
  }, [
    socket,
    handleReviewReceived,
    handleReviewResponse,
    handleReviewHelpful,
    handleReviewMilestone,
  ]);

  return {
    // Hook doesn't need to return anything
    // It just sets up listeners and handles events
  };
}
