/**
 * useLikeSocket Hook
 * Handles real-time like updates via Socket.IO
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface LikeSocketData {
  type: string;
  likeCount?: number;
  totalLikes?: number;
  serviceName?: string;
  serviceId?: string;
  timestamp?: string;
}

export function useLikeSocket() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Handle provider liked event
  const handleProviderLiked = useCallback((data: LikeSocketData) => {
    toast.success(`${data.likeCount} New ${data.likeCount === 1 ? 'Like' : 'Likes'}! ❤️`, {
      description: `Total likes: ${data.totalLikes}`,
    });

    // Invalidate analytics and stats queries
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  // Handle service liked event
  const handleServiceLiked = useCallback((data: LikeSocketData) => {
    toast.success('Service Liked! ❤️', {
      description: `${data.serviceName} received ${data.likeCount} new ${data.likeCount === 1 ? 'like' : 'likes'}`,
    });

    // Invalidate service and stats queries
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['service', data.serviceId] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
  }, [queryClient]);

  // Set up Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    // Register all event listeners
    socket.on('provider_liked', handleProviderLiked);
    socket.on('service_liked', handleServiceLiked);

    // Cleanup listeners on unmount
    return () => {
      socket.off('provider_liked', handleProviderLiked);
      socket.off('service_liked', handleServiceLiked);
    };
  }, [socket, handleProviderLiked, handleServiceLiked]);

  return {
    // Hook doesn't need to return anything
    // It just sets up listeners and handles events
  };
}
