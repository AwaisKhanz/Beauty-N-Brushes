/**
 * AI Messaging Types
 *
 * Types for AI-powered message drafts and chatbot responses.
 *
 * @module shared-types/ai-messaging
 *
 * **Backend Usage:**
 * - `backend/src/controllers/message.controller.ts`
 * - `backend/src/services/ai-messaging.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.messages)
 * - `frontend/src/components/messages/`
 */

// ================================
// AI Message Draft Types
// ================================

export interface GenerateMessageDraftRequest {
  conversationId: string;
  clientMessage: string;
}

export interface GenerateMessageDraftResponse {
  message: string;
  draft: string;
  confidence: number;
}

export interface AcceptDraftRequest {
  draftText: string;
  conversationId: string;
}

export interface AcceptDraftResponse {
  message: string;
  messageId: string;
}

// ================================
// AI Chatbot Types
// ================================

export interface ChatbotQueryRequest {
  query: string;
  context: 'homepage' | 'provider_profile';
  providerId?: string;
}

export interface ChatbotQueryResponse {
  message: string;
  response: string;
}

// ================================
// Message Types with AI Fields
// ================================

export interface AIMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachmentUrls: string[];
  isRead: boolean;
  readAt: string | null;
  aiDrafted: boolean;
  aiDraftAccepted: boolean;
  aiModelUsed: string | null;
  createdAt: string;
}
