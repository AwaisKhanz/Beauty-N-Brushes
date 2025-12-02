import { prisma as db } from '../config/database';
import { emitNewMessage, emitConversationUpdate, isUserViewingConversation } from '../config/socket.server';
import { notificationService } from './notification.service';
import type {
  Conversation,
  Message,
  CreateMessageRequest,
  GetConversationsRequest,
  GetMessagesRequest,
} from '../../../shared-types/message.types';
import logger from '@/utils/logger';

export const messageService = {
  /**
   * Get or create conversation between client and provider
   */
  async getOrCreateConversation(
    clientId: string,
    providerId: string,
    bookingId?: string
  ): Promise<Conversation> {
    // Try to find existing conversation
    let conversation = await db.conversation.findFirst({
      where: {
        clientId,
        providerId,
        ...(bookingId ? { bookingId } : {}),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        provider: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            businessName: true,
            logoUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            service: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          clientId,
          providerId,
          bookingId: bookingId || null,
          status: 'active',
          clientUnreadCount: 0,
          providerUnreadCount: 0,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          provider: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              businessName: true,
              logoUrl: true,
            },
          },
          booking: {
            select: {
              id: true,
              appointmentDate: true,
              appointmentTime: true,
              service: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });
    }

    return conversation as unknown as Conversation;
  },

  /**
   * Create empty conversation (without initial message)
   */
  async createEmptyConversation(clientId: string, providerId: string): Promise<Conversation> {
    // Check if conversation already exists
    const existing = await db.conversation.findFirst({
      where: {
        clientId,
        providerId,
      },
    });

    if (existing) {
      // Return existing conversation with full details
      return this.getOrCreateConversation(clientId, providerId);
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        clientId,
        providerId,
        status: 'active',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        provider: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            businessName: true,
            logoUrl: true,
          },
        },
      },
    });

    // Emit Socket.IO event to both users
    try {
      emitConversationUpdate(conversation.id, conversation);
    } catch (error) {
      logger.error('Failed to emit conversation update:', error);
    }

    return conversation as unknown as Conversation;
  },

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    data: CreateMessageRequest
  ): Promise<{ message: Message; conversation: Conversation }> {
    // Get or create conversation
    let conversation: Conversation;

    if (data.conversationId) {
      // Fetch existing conversation
      const existingConversation = await db.conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          provider: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              businessName: true,
              logoUrl: true,
            },
          },
          booking: {
            select: {
              id: true,
              appointmentDate: true,
              appointmentTime: true,
              service: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      if (!existingConversation) {
        throw new Error('Conversation not found');
      }

      conversation = existingConversation as unknown as Conversation;
    } else {
      // Create new conversation
      if (!data.providerId) {
        throw new Error('Provider ID required for new conversation');
      }

      // Get current user to determine if they're client or provider
      const user = await db.user.findUnique({ where: { id: senderId } });
      if (!user) throw new Error('User not found');

      let clientId: string;
      let providerId: string;

      if (user.role === 'CLIENT') {
        clientId = user.id;
        providerId = data.providerId;
      } else {
        // Provider sending message - need to find client from booking
        throw new Error('Providers must reply to existing conversations');
      }

      conversation = await this.getOrCreateConversation(clientId, providerId, data.bookingId);
    }

    // Create message
    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        messageType: data.attachmentUrls && data.attachmentUrls.length > 0 ? 'image' : 'text',
        content: data.content,
        attachmentUrls: data.attachmentUrls || [],
        isRead: false,
        isSystemMessage: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation
    const isClient = senderId === conversation.clientId;
    const updatedConversation = await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: data.content.substring(0, 100),
        // Increment unread count for receiver
        ...(isClient
          ? { providerUnreadCount: { increment: 1 } }
          : { clientUnreadCount: { increment: 1 } }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        provider: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            businessName: true,
            logoUrl: true,
          },
        },
      },
    });

    // Emit Socket.IO events for real-time updates
    try {
      // Emit new message to conversation participants
      emitNewMessage(conversation.id, message, conversation);

      // Emit conversation update
      emitConversationUpdate(conversation.id, updatedConversation);

      // Determine recipient and create notification
      const recipientId = isClient ? updatedConversation.provider.user.id : conversation.clientId;
      const senderName = isClient
        ? `${message.sender.firstName} ${message.sender.lastName}`
        : updatedConversation.provider.businessName;

      // Check if recipient is actively viewing this conversation
      const isRecipientViewing = await isUserViewingConversation(recipientId, conversation.id);
      
      // Only create notification if recipient is NOT viewing the conversation
      if (!isRecipientViewing) {
        // Create in-app notification (this already emits the notification via Socket.IO)
        await notificationService.createMessageNotification(
          recipientId,
          senderName,
          data.content,
          conversation.id,
          senderId // Pass sender ID for context checking
        );
      } else {
        console.log(`📭 Skipping notification - user ${recipientId} is viewing conversation ${conversation.id}`);
      }
    } catch (error) {
      // Log error but don't fail the message send
      console.error('Failed to emit Socket.IO events:', error);
    }

    return {
      message: message as unknown as Message,
      conversation: updatedConversation as unknown as Conversation,
    };
  },

  /**
   * Get conversations for a user
   */
  async getConversations(
    userId: string,
    params: GetConversationsRequest
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Determine if user is client or provider
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const whereClause =
      user.role === 'CLIENT'
        ? { clientId: userId, status: params.status || 'active' }
        : user.role === 'PROVIDER'
          ? {
              provider: { userId },
              status: params.status || 'active',
            }
          : {};

    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          provider: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
            },
          },
          booking: {
            select: {
              id: true,
              appointmentDate: true,
              appointmentTime: true,
              service: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.conversation.count({ where: whereClause }),
    ]);

    return {
      conversations: conversations as unknown as Conversation[],
      total,
    };
  },

  /**
   * Get messages in a conversation
   */
  async getMessages(
    userId: string,
    params: GetMessagesRequest
  ): Promise<{ messages: Message[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    // Verify user has access to conversation
    const conversation = await db.conversation.findUnique({
      where: { id: params.conversationId },
    });

    if (!conversation) throw new Error('Conversation not found');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const hasAccess =
      conversation.clientId === userId ||
      (user.role === 'PROVIDER' &&
        (await db.providerProfile.findFirst({
          where: { userId, id: conversation.providerId },
        })));

    if (!hasAccess) throw new Error('Access denied');

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where: { conversationId: params.conversationId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      db.message.count({ where: { conversationId: params.conversationId } }),
    ]);

    return {
      messages: messages as unknown as Message[],
      total,
    };
  },

  /**
   * Mark messages as read
   */
  async markAsRead(userId: string, conversationId: string): Promise<number> {
    // Verify access
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error('Conversation not found');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const hasAccess =
      conversation.clientId === userId ||
      (user.role === 'PROVIDER' &&
        (await db.providerProfile.findFirst({
          where: { userId, id: conversation.providerId },
        })));

    if (!hasAccess) throw new Error('Access denied');

    // Mark all unread messages as read
    const result = await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Reset unread count
    const isClient = conversation.clientId === userId;
    await db.conversation.update({
      where: { id: conversationId },
      data: isClient ? { clientUnreadCount: 0 } : { providerUnreadCount: 0 },
    });

    return result.count;
  },

  /**
   * Update conversation status
   */
  async updateConversation(
    userId: string,
    conversationId: string,
    status: 'active' | 'archived' | 'blocked'
  ): Promise<Conversation> {
    // Verify access
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error('Conversation not found');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const hasAccess =
      conversation.clientId === userId ||
      (user.role === 'PROVIDER' &&
        (await db.providerProfile.findFirst({
          where: { userId, id: conversation.providerId },
        })));

    if (!hasAccess) throw new Error('Access denied');

    const updated = await db.conversation.update({
      where: { id: conversationId },
      data: { status },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            service: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return updated as unknown as Conversation;
  },
};
