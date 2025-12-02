/**
 * useTeamSocket Hook
 * Handles real-time team updates via Socket.IO
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface TeamSocketData {
  type: string;
  member?: {
    name: string;
    role: string;
  };
  providerName?: string;
  reason?: string;
  oldRole?: string;
  newRole?: string;
  timestamp?: string;
}

export function useTeamSocket() {
  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle team member joined event
  const handleTeamMemberJoined = useCallback((data: TeamSocketData) => {
    toast({
      title: 'New Team Member! 👥',
      description: `${data.member?.name} joined as ${data.member?.role}`,
      variant: 'default',
    });

    // Invalidate team queries
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
    queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
  }, [toast, queryClient]);

  // Handle team member removed event
  const handleTeamMemberRemoved = useCallback((data: TeamSocketData) => {
    toast({
      title: 'Removed from Team',
      description: `You were removed from ${data.providerName}'s team${data.reason ? `: ${data.reason}` : ''}`,
      variant: 'destructive',
    });

    // Invalidate team queries
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
  }, [toast, queryClient]);

  // Handle team role changed event
  const handleTeamRoleChanged = useCallback((data: TeamSocketData) => {
    toast({
      title: 'Role Updated',
      description: `Your role changed from ${data.oldRole} to ${data.newRole}`,
      variant: 'default',
    });

    // Invalidate team queries
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
  }, [toast, queryClient]);

  // Set up Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    // Register all event listeners
    socket.on('team_member_joined', handleTeamMemberJoined);
    socket.on('team_member_removed', handleTeamMemberRemoved);
    socket.on('team_role_changed', handleTeamRoleChanged);

    // Cleanup listeners on unmount
    return () => {
      socket.off('team_member_joined', handleTeamMemberJoined);
      socket.off('team_member_removed', handleTeamMemberRemoved);
      socket.off('team_role_changed', handleTeamRoleChanged);
    };
  }, [socket, handleTeamMemberJoined, handleTeamMemberRemoved, handleTeamRoleChanged]);

  return {
    // Hook doesn't need to return anything
    // It just sets up listeners and handles events
  };
}
