import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface JWTPayload {
  userId: string;  // Changed from 'id' to match actual JWT structure
  email: string;
  role: string;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server with Redis adapter
 */
export async function initializeSocketIO(httpServer: HTTPServer): Promise<SocketIOServer> {
  // Create Socket.IO server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Setup Redis adapter for scalability (optional but recommended)
  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter initialized');
    } catch (error) {
      logger.warn('Failed to initialize Redis adapter, using default adapter', error);
    }
  }

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    // Try to get token from cookies first (httpOnly cookie sent via withCredentials)
    const cookieHeader = socket.handshake.headers.cookie;
    let token: string | undefined;

    if (cookieHeader) {
      // Parse cookies manually
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['access_token'];
    }

    // Fallback to auth header or handshake auth
    if (!token) {
      token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      logger.warn('Socket connection attempt without token');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      // Store in socket.data which persists across middleware and connection handler
      socket.data.userId = decoded.userId;
      socket.data.userRole = decoded.role;
      // Also set on socket for backwards compatibility
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      logger.info(`✅ Socket authenticated for user: ${decoded.userId} (${decoded.role})`);
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    // Get user info from socket.data (more reliable than socket properties)
    const userId = socket.data.userId || socket.userId;
    const userRole = socket.data.userRole || socket.userRole;
    
    if (!userId) {
      logger.error('❌ Socket connected without userId!');
      socket.disconnect();
      return;
    }
    
    logger.info(`✅ User connected: ${userId} (${userRole})`);

    // Join user's personal room for direct notifications
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    logger.info(`✅ User ${userId} joined personal room: ${userRoom}`);

    // Join conversation room when user opens a conversation
    socket.on('join_conversation', (data: { conversationId: string }) => {
      const conversationRoom = `conversation:${data.conversationId}`;
      socket.join(conversationRoom);
      logger.info(`👁️  User ${userId} joined conversation room: ${conversationRoom}`);
    });

    // Leave conversation room when user closes/leaves a conversation
    socket.on('leave_conversation', (data: { conversationId: string }) => {
      const conversationRoom = `conversation:${data.conversationId}`;
      socket.leave(conversationRoom);
      logger.info(`👋 User ${userId} left conversation room: ${conversationRoom}`);
    });

    // Typing indicator - emit directly to other user's room
    socket.on('typing', (data: { conversationId: string; otherUserId: string; isTyping: boolean }) => {
      io!.to(`user:${data.otherUserId}`).emit('user_typing', {
        userId: userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    });

    // Mark messages as read - emit directly to other user's room
    socket.on('mark_read', (data: { conversationId: string; otherUserId: string }) => {
      io!.to(`user:${data.otherUserId}`).emit('messages_read', {
        conversationId: data.conversationId,
        userId: userId,
        readAt: new Date(),
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

/**
 * Get Socket.IO server instance
 */
export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
}

/**
 * Emit new message to conversation participants
 */
export function emitNewMessage(conversationId: string, message: any, conversation: any) {
  if (!io) return;

  // Emit to client's personal room
  if (conversation.clientId) {
    io.to(`user:${conversation.clientId}`).emit('new_message', {
      conversationId,
      message,
    });
  }
  
  // Emit to provider's personal room (use provider.user.id, not providerId which is the profile ID)
  if (conversation.provider?.user?.id) {
    io.to(`user:${conversation.provider.user.id}`).emit('new_message', {
      conversationId,
      message,
    });
  } else if (conversation.provider?.userId) {
    // Fallback if provider object has userId directly
    io.to(`user:${conversation.provider.userId}`).emit('new_message', {
      conversationId,
      message,
    });
  } else {
    logger.warn(`⚠️  Could not find provider user ID for conversation ${conversationId}`);
  }

  logger.info(`📨 Emitted new message to conversation ${conversationId} participants`);
}

/**
 * Emit conversation update to participants
 */
export function emitConversationUpdate(conversationId: string, conversation: any) {
  if (!io) return;

  // Emit to client's personal room
  if (conversation.clientId) {
    io.to(`user:${conversation.clientId}`).emit('conversation_updated', {
      conversationId,
      conversation,
    });
  }
  
  // Emit to provider's personal room (use provider.user.id, not providerId which is the profile ID)
  if (conversation.provider?.user?.id) {
    io.to(`user:${conversation.provider.user.id}`).emit('conversation_updated', {
      conversationId,
      conversation,
    });
  } else if (conversation.provider?.userId) {
    // Fallback if provider object has userId directly
    io.to(`user:${conversation.provider.userId}`).emit('conversation_updated', {
      conversationId,
      conversation,
    });
  } else {
    logger.warn(`⚠️  Could not find provider user ID for conversation ${conversationId}`);
  }

  logger.info(`💬 Emitted conversation update for ${conversationId} to both participants`);
}

/**
 * Emit notification to specific user
 */
export function emitNotification(userId: string, notification: any) {
  if (!io) return;

  const userRoom = `user:${userId}`;
  const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
  const socketCount = socketsInRoom ? socketsInRoom.size : 0;
  
  logger.info(`📢 Emitting notification to user ${userId} (room: ${userRoom}, sockets: ${socketCount})`);
  logger.info(`📢 Notification type: ${notification.type}, title: ${notification.title}`);
  
  io.to(userRoom).emit('notification', notification);
  
  if (socketCount === 0) {
    logger.warn(`⚠️  No sockets in room ${userRoom} - user may not be connected`);
  }
}

/**
 * Emit booking update to user(s)
 */
export function emitBookingUpdate(userIds: string | string[], data: any) {
  if (!io) return;

  const users = Array.isArray(userIds) ? userIds : [userIds];
  const eventName = data.type; // Use specific event type from data
  
  users.forEach(userId => {
    io!.to(`user:${userId}`).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  logger.info(`Emitted ${eventName} to ${users.length} user(s)`);
}

/**
 * Emit refund update to specific user(s)
 */
export function emitRefundUpdate(userIds: string | string[], data: any) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return;
  }

  const users = Array.isArray(userIds) ? userIds : [userIds];
  
  users.forEach(userId => {
    io!.to(`user:${userId}`).emit('refund:update', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  logger.info(`Emitted refund update to ${users.length} user(s)`);
}

/**
 * Emit payment update to user(s)
 */
export function emitPaymentUpdate(userIds: string | string[], data: any) {
  if (!io) return;

  const users = Array.isArray(userIds) ? userIds : [userIds];
  
  users.forEach(userId => {
    io!.to(`user:${userId}`).emit('payment_updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  logger.info(`Emitted payment update to ${users.length} user(s)`);
}

export function emitReviewUpdate(userIds: string | string[], data: any) {
  if (!io) return;

  const users = Array.isArray(userIds) ? userIds : [userIds];
  const eventName = data.type; // Use specific event type from data
  
  users.forEach(userId => {
    io!.to(`user:${userId}`).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  logger.info(`Emitted ${eventName} to ${users.length} user(s)`);
}

export function emitServiceUpdate(userIds: string | string[], data: any) {
  if (!io) return;

  const users = Array.isArray(userIds) ? userIds : [userIds];
  const eventName = data.type; // Use specific event type from data
  
  users.forEach(userId => {
    io!.to(`user:${userId}`).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  logger.info(`Emitted ${eventName} to ${users.length} user(s)`);
}

export function emitLikeUpdate(userIds: string | string[], data: any) {
  if (!io) return;

  const users = Array.isArray(userIds) ? userIds : [userIds];
  const eventName = data.type; // Use specific event type from data
  
  users.forEach(userId => {
    io!.to(`user:${userId}`).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  logger.info(`Emitted ${eventName} to ${users.length} user(s)`);
}

export function emitTeamUpdate(userIds: string | string[], data: any) {
  if (!io) return;

  const users = Array.isArray(userIds) ? userIds : [userIds];
  const eventName = data.type; // Use specific event type from data
  
  users.forEach(userId => {
    io!.to(`user:${userId}`).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  logger.info(`Emitted ${eventName} to ${users.length} user(s)`);
}

/**
 * Get online users count in a conversation
 */
export async function getOnlineUsersInConversation(conversationId: string): Promise<number> {
  if (!io) return 0;

  const sockets = await io.in(`conversation:${conversationId}`).fetchSockets();
  return sockets.length;
}

/**
 * Check if a user is currently viewing a conversation
 */
export async function isUserViewingConversation(userId: string, conversationId: string): Promise<boolean> {
  if (!io) return false;

  const conversationRoom = `conversation:${conversationId}`;
  const sockets = await io.in(conversationRoom).fetchSockets();
  
  // Check if any socket in the conversation room belongs to this user
  const isViewing = sockets.some(socket => {
    const socketUserId = socket.data.userId || (socket as any).userId;
    return socketUserId === userId;
  });
  
  logger.info(`🔍 Checking if user ${userId} is viewing conversation ${conversationId}: ${isViewing}`);
  return isViewing;
}
