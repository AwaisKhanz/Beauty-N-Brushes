'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  emitTyping: (conversationId: string, otherUserId: string, isTyping: boolean) => void;
  emitMarkRead: (conversationId: string, otherUserId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Since the auth token is stored in an httpOnly cookie, we can't read it with JavaScript
    // Instead, we'll use withCredentials to send the cookie automatically with the Socket.IO connection
    console.log('🔌 Initializing Socket.IO connection with httpOnly cookie authentication');

    // Create Socket.IO connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true, // This sends httpOnly cookies automatically
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      console.error('This might mean: 1) Backend is down, 2) Not logged in, or 3) CORS issue');
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed');
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Closing Socket.IO connection');
      newSocket.close();
    };
  }, []);

  const emitTyping = useCallback((conversationId: string, otherUserId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', { conversationId, otherUserId, isTyping });
    }
  }, [socket]);

  const emitMarkRead = useCallback((conversationId: string, otherUserId: string) => {
    if (socket) {
      socket.emit('mark_read', { conversationId, otherUserId });
    }
  }, [socket]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socket) {
      console.log(`👁️  Joining conversation room: ${conversationId}`);
      socket.emit('join_conversation', { conversationId });
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket) {
      console.log(`👋 Leaving conversation room: ${conversationId}`);
      socket.emit('leave_conversation', { conversationId });
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, emitTyping, emitMarkRead, joinConversation, leaveConversation, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
