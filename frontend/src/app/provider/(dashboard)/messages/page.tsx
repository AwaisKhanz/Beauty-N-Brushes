'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, MessageSquare, Users } from 'lucide-react';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageThread } from '@/components/messages/MessageThread';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { Conversation } from '../../../../../../shared-types/message.types';

export default function ProviderMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      setLoading(true);
      setError('');
      const res = await api.messages.getConversations();
      setConversations(res.data.conversations);

      // Auto-select first conversation if available
      if (res.data.conversations.length > 0 && !selectedConversationId) {
        setSelectedConversationId(res.data.conversations[0].id);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  function handleConversationSelect(conversationId: string) {
    setSelectedConversationId(conversationId);
  }

  function handleMessageSent() {
    // Refresh conversations to update last message preview
    fetchConversations();
  }

  if (loading) {
    return <MessagesSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">Messages</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with your clients</p>
      </div>

      {/* Messages Container */}
      {conversations.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="flex h-[calc(100vh-16rem)]">
            {/* Conversations List - Left Sidebar */}
            <div className="w-full md:w-80 border-r overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleConversationSelect}
                userRole="provider"
              />
            </div>

            {/* Message Thread - Main Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversationId ? (
                <MessageThread
                  conversationId={selectedConversationId}
                  onMessageSent={handleMessageSent}
                  showAIDrafts={true}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        // Empty State
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50 text-primary" />
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            When clients message you about bookings or services, conversations will appear here
          </p>
        </div>
      )}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Card>
        <div className="flex h-[calc(100vh-16rem)]">
          <div className="w-80 border-r p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-32 w-64" />
          </div>
        </div>
      </Card>
    </div>
  );
}
