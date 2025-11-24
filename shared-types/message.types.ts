/**
 * Message Types
 * Types for messaging system
 */

// ================================
// Conversation Types
// ================================

export interface Conversation {
  id: string;
  clientId: string;
  providerId: string;
  bookingId: string | null;
  status: 'active' | 'archived' | 'blocked';
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  clientUnreadCount: number;
  providerUnreadCount: number;
  createdAt: string;
  updatedAt: string;

  // Related data
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  provider?: {
    id: string;
    businessName: string;
    logoUrl: string | null;
  };
  booking?: {
    id: string;
    service: {
      title: string;
    };
    appointmentDate: string;
    appointmentTime: string;
  };
}

// ================================
// Message Types
// ================================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: 'text' | 'image' | 'system';
  content: string;
  attachmentUrls: string[];
  isRead: boolean;
  readAt: string | null;
  isSystemMessage: boolean;
  systemMessageType: string | null;
  createdAt: string;

  // Related data
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    avatarUrl?: string;
    logoUrl?: string;
  };
}

// ================================
// Request Types
// ================================

export interface CreateMessageRequest {
  conversationId?: string; // Optional - create new conversation if not provided
  providerId?: string; // Required if creating new conversation
  bookingId?: string; // Optional - link to booking
  content: string;
  attachmentUrls?: string[];
}

export interface GetConversationsRequest {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived' | 'blocked';
}

export interface GetMessagesRequest {
  conversationId: string;
  page?: number;
  limit?: number;
}

export interface MarkAsReadRequest {
  conversationId: string;
}

export interface UpdateConversationRequest {
  status?: 'active' | 'archived' | 'blocked';
}

// ================================
// Response Types
// ================================

export interface CreateMessageResponse {
  message: string;
  data: {
    message: Message;
    conversation: Conversation;
  };
}

export interface GetConversationsResponse {
  message: string;
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetMessagesResponse {
  message: string;
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MarkAsReadResponse {
  message: string;
  markedCount: number;
}

export interface UpdateConversationResponse {
  message: string;
  conversation: Conversation;
}
