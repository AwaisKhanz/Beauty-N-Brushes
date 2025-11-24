'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MessageInput } from '@/components/messages/MessageInput';
import { AIDraftSuggestion } from '@/components/messages/AIDraftSuggestion';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '../../../../shared-types/message.types';

interface MessageThreadProps {
  conversationId: string;
  onMessageSent: () => void;
  showAIDrafts?: boolean; // Enable AI drafts for providers
}

export function MessageThread({
  conversationId,
  onMessageSent,
  showAIDrafts = false,
}: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftText, setDraftText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    markAsRead();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages() {
    try {
      setLoading(true);
      setError('');
      const res = await api.messages.getMessages(conversationId);
      setMessages(res.data.messages);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead() {
    try {
      await api.messages.markAsRead(conversationId);
    } catch (err) {
      // Silent fail - not critical
      console.error('Failed to mark messages as read:', err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSendMessage(content: string, attachmentUrls?: string[]) {
    try {
      await api.messages.send({
        conversationId,
        content,
        attachmentUrls,
      });

      // Refresh messages
      await fetchMessages();
      onMessageSent();

      // Clear AI draft after sending
      setDraftText('');
    } catch (err: unknown) {
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.senderId === user?.id;

              return (
                <div
                  key={message.id}
                  className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn('max-w-[70%] space-y-2')}>
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2',
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>

                    {/* Attachments */}
                    {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {message.attachmentUrls.map((url: string, index: number) => (
                          <div key={index} className="relative w-full aspect-square">
                            <Image
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              fill
                              className="rounded-lg object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p
                      className={cn(
                        'text-xs text-muted-foreground',
                        isCurrentUser ? 'text-right' : 'text-left'
                      )}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4 space-y-3">
        {/* AI Draft Suggestion (Providers only) */}
        {showAIDrafts && user?.role === 'PROVIDER' && lastClientMessage && (
          <AIDraftSuggestion
            conversationId={conversationId}
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
