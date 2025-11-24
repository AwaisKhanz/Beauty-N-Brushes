import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { messageService } from '../services/message.service';
import { aiMessagingService } from '../services/ai-messaging.service';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type {
  CreateMessageRequest,
  CreateMessageResponse,
  GetConversationsRequest,
  GetConversationsResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  MarkAsReadRequest,
  MarkAsReadResponse,
  UpdateConversationRequest,
  UpdateConversationResponse,
} from '../../../shared-types/message.types';
import type {
  GenerateMessageDraftRequest,
  GenerateMessageDraftResponse,
  ChatbotQueryRequest,
  ChatbotQueryResponse,
} from '../../../shared-types/ai-messaging.types';
import { z } from 'zod';

/**
 * Send a message
 */
export async function sendMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z
      .object({
        content: z
          .string()
          .min(1, 'Message content is required')
          .max(2000, 'Message must be under 2000 characters'),
        conversationId: z.string().uuid().optional(),
        providerId: z.string().uuid().optional(),
        mediaUrls: z.array(z.string().url()).optional(),
      })
      .refine((data) => data.conversationId || data.providerId, {
        message: 'Either conversation ID or provider ID is required',
      });

    const data = schema.parse(req.body) as CreateMessageRequest;

    const result = await messageService.sendMessage(userId, data);

    sendSuccess<CreateMessageResponse>(
      res,
      {
        message: 'Message sent',
        data: result,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Get conversations for current user
 */
export async function getConversations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const params: GetConversationsRequest = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as 'active' | 'archived' | 'blocked' | undefined,
    };

    const { conversations, total } = await messageService.getConversations(userId, params);

    const totalPages = Math.ceil(total / params.limit!);

    sendSuccess<GetConversationsResponse>(res, {
      message: 'Conversations retrieved',
      conversations,
      pagination: {
        page: params.page!,
        limit: params.limit!,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages in a conversation
 */
export async function getMessages(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const { conversationId } = req.params;

    if (!conversationId) {
      throw new AppError(400, 'Conversation ID is required');
    }

    const params: GetMessagesRequest = {
      conversationId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const { messages, total } = await messageService.getMessages(userId, params);

    const totalPages = Math.ceil(total / params.limit!);

    sendSuccess<GetMessagesResponse>(res, {
      message: 'Messages retrieved',
      messages,
      pagination: {
        page: params.page!,
        limit: params.limit!,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const data: MarkAsReadRequest = req.body;

    if (!data.conversationId) {
      throw new AppError(400, 'Conversation ID is required');
    }

    const markedCount = await messageService.markAsRead(userId, data.conversationId);

    sendSuccess<MarkAsReadResponse>(res, {
      message: 'Messages marked as read',
      markedCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update conversation status
 */
export async function updateConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const { conversationId } = req.params;
    const data: UpdateConversationRequest = req.body;

    if (!conversationId) {
      throw new AppError(400, 'Conversation ID is required');
    }

    if (!data.status) {
      throw new AppError(400, 'Status is required');
    }

    const conversation = await messageService.updateConversation(
      userId,
      conversationId,
      data.status
    );

    sendSuccess<UpdateConversationResponse>(res, {
      message: 'Conversation updated',
      conversation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate AI draft reply for provider
 */
export async function generateDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      conversationId: z.string().uuid(),
      clientMessage: z.string().min(1),
    });

    const data = schema.parse(req.body) as GenerateMessageDraftRequest;

    // Get conversation and verify provider ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: {
        provider: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    if (conversation.provider.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Generate draft
    const result = await aiMessagingService.generateDraftReply({
      providerId: conversation.provider.id,
      clientMessage: data.clientMessage,
      conversationId: data.conversationId,
    });

    sendSuccess<GenerateMessageDraftResponse>(res, {
      message: 'Draft generated successfully',
      draft: result.draft,
      confidence: result.confidence,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle chatbot query
 */
export async function chatbot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      query: z.string().min(1),
      context: z.enum(['homepage', 'provider_profile']),
      providerId: z.string().uuid().optional(),
    });

    const data = schema.parse(req.body) as ChatbotQueryRequest;

    if (data.context === 'provider_profile' && !data.providerId) {
      throw new AppError(400, 'Provider ID required for provider profile context');
    }

    const response = await aiMessagingService.generateChatbotResponse(data);

    sendSuccess<ChatbotQueryResponse>(res, {
      message: 'Response generated successfully',
      response,
    });
  } catch (error) {
    next(error);
  }
}
