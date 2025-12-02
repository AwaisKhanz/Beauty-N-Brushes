'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, CheckCheck } from 'lucide-react';
import { MessageInput } from '@/components/messages/MessageInput';
import { AIDraftSuggestion } from '@/components/messages/AIDraftSuggestion';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';
import type { Message } from '../../../../shared-types/message.types';

interface MessageThreadProps {
  conversationId?: string; // Optional for new conversations
  providerId?: string; // For creating new conversations
  showAIDrafts?: boolean; // Enable AI drafts for providers
}

export function MessageThread({
  conversationId,
  providerId,
  showAIDrafts = false,
}: MessageThreadProps) {
  const { user } = useAuth();
  const { socket, isConnected, emitMarkRead, joinConversation, leaveConversation } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftText, setDraftText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    markAsRead();

    // Join conversation room to let backend know we're viewing this conversation
    if (conversationId) {
      joinConversation(conversationId);
    }
    
    return () => {
      // Leave conversation room when component unmounts or conversation changes
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, joinConversation, leaveConversation]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          // Check if this is a duplicate (message already exists)
          if (prev.some((m) => m.id === data.message.id)) {
            return prev;
          }

          // If message is from current user, replace the optimistic message
          if (data.message.senderId === user?.id) {
            // Find and replace the temporary optimistic message
            const withoutOptimistic = prev.filter((m) => !m.id.startsWith('temp-'));
            return [...withoutOptimistic, data.message];
          }

          // Message from other user - just add it
          return [...prev, data.message];
        });

        // Mark as read if message is from other user
        if (data.message.senderId !== user?.id) {
          markAsRead();
        }
      }
    };

    const handleUserTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, conversationId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages() {
    // Skip fetching if no conversationId (new conversation)
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.messages.getMessages(conversationId);
      setMessages(res.data.messages);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  function markAsRead() {
    if (conversationId && isConnected && messages.length > 0) {
      // Find the other user's ID from the messages
      const otherUserMessage = messages.find(m => m.senderId !== user?.id);
      const otherUserId = otherUserMessage?.senderId;
      
      if (otherUserId) {
        emitMarkRead(conversationId, otherUserId);
      }
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSendMessage(content: string, attachmentUrls?: string[]) {
    try {
      // Optimistic UI update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId || 'temp',
        senderId: user?.id || '',
        messageType: attachmentUrls && attachmentUrls.length > 0 ? 'image' : 'text',
        content,
        attachmentUrls: attachmentUrls || [],
        isRead: false,
        readAt: null,
        isSystemMessage: false,
        systemMessageType: null,
        createdAt: new Date().toISOString(),
        sender: {
          id: user?.id || '',
          firstName: user?.firstName,
          lastName: user?.lastName,
          avatarUrl: user?.avatarUrl ?? undefined,
        },
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Send message via API
      const payload: any = {
        content,
        attachmentUrls,
      };

      // If no conversationId, use providerId to create new conversation
      if (!conversationId && providerId) {
        payload.providerId = providerId;
      } else if (conversationId) {
        payload.conversationId = conversationId;
      } else {
        throw new Error('Either conversationId or providerId is required');
      }

      await api.messages.send(payload);

      // Socket.IO will handle updating the conversation list via 'conversation_updated' event
      // The new conversation will appear automatically in the list
      // No need to manually refresh - the real-time update is more efficient

      // Clear AI draft after sending
      setDraftText('');
    } catch (err: unknown) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
      throw new Error(extractErrorMessage(err) || 'Failed to send message');
    }
  }

  function handleAcceptDraft(draft: string) {
    setDraftText(draft);
  }

  function handleDismissDraft() {
    setDraftText('');
  }

  // Get last client message for AI context
  const lastClientMessage = messages.filter((m) => m.senderId !== user?.id).slice(-1)[0];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
              <Skeleton className="h-16 w-64 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages List */}
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length > 0 ? (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === user?.id;
              const showAvatar =
                !isCurrentUser &&
                (index === 0 || messages[index - 1].senderId !== message.senderId);
              const showDateSeparator =
                index === 0 || !isSameDay(new Date(messages[index - 1].createdAt), new Date(message.createdAt));

              return (
                <div key={message.id} className="space-y-6">
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex justify-center">
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        {format(new Date(message.createdAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      'flex gap-3',
                      isCurrentUser ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {/* Avatar (only for other user) */}
                    {!isCurrentUser && (
                      <div className="w-8 h-8 flex-shrink-0">
                        {showAvatar ? (
                          message.sender?.avatarUrl ? (
                            <Image
                              src={message.sender.avatarUrl}
                              alt={message.sender.firstName || 'User'}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {message.sender?.firstName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="w-8" /> // Spacer
                        )}
                      </div>
                    )}

                    <div className={cn('max-w-[70%] space-y-1', isCurrentUser ? 'items-end' : 'items-start')}>
                      {/* Message Bubble */}
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2 shadow-sm',
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-card border text-card-foreground rounded-bl-none'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>
                      </div>

                      {/* Attachments */}
                      {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {message.attachmentUrls.map((url: string, idx: number) => (
                            <div key={idx} className="relative w-full aspect-square group cursor-pointer overflow-hidden rounded-lg border">
                              <Image
                                src={url}
                                alt={`Attachment ${idx + 1}`}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metadata (Time & Read Status) */}
                      <div
                        className={cn(
                          'flex items-center gap-1 text-[10px] text-muted-foreground',
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
                        {isCurrentUser && (
                          <span className="ml-1">
                            {message.isRead ? (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4 space-y-3">
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Typing...</span>
          </div>
        )}

        {/* AI Draft Suggestion (Providers only) */}
        {showAIDrafts && user?.role === 'PROVIDER' && lastClientMessage && (
          <AIDraftSuggestion
            conversationId={conversationId!}
            lastClientMessage={lastClientMessage.content}
            onAcceptDraft={handleAcceptDraft}
            onDismiss={handleDismissDraft}
          />
        )}

        <MessageInput onSend={handleSendMessage} initialText={draftText} />
      </div>
    </div>
  );
}
