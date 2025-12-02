import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as messageController from '../controllers/message.controller';

const router = Router();

// All message routes require authentication
router.use(authenticate);

// Send a message
router.post('/send', messageController.sendMessage);

// Create empty conversation
router.post('/conversations', messageController.createConversation);

// Get conversations
router.get('/conversations', messageController.getConversations);

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Mark messages as read
router.post('/mark-read', messageController.markAsRead);

// Update conversation status (archive, block, etc.)
router.put('/conversations/:conversationId', messageController.updateConversation);

// AI-powered features
router.post('/ai/generate-draft', messageController.generateDraft);
router.post('/ai/chatbot', messageController.chatbot);

export default router;
