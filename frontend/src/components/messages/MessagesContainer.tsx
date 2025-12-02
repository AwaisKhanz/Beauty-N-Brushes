'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { useSocket } from '@/contexts/SocketContext';
import type { Conversation } from '../../../../shared-types/message.types';
import { cn } from '@/lib/utils';

interface MessagesContainerProps {
  userRole: 'CLIENT' | 'PROVIDER';
  basePath: string; // '/client/messages' or '/provider/messages'
}

export function MessagesContainer({ userRole, basePath }: MessagesContainerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  // Sync conversationId parameter (for direct links)
  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    if (conversationId && conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  // Listen for real-time conversation updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdate = (data: { conversationId: string; conversation: Conversation }) => {
      console.log(`[${userRole} Messages] Received conversation_updated event:`, data);
      
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversation.id);
        if (index > -1) {
          // Update existing conversation and move to top
          const newConversations = [...prev];
          newConversations.splice(index, 1);
          return [data.conversation, ...newConversations];
        } else {
          // Add new conversation to top
          return [data.conversation, ...prev];
        }
      });
      
      // If this is a new conversation for the current conversation parameter, select it
      const conversationParam = searchParams.get('conversation');
      if (conversationParam && !selectedConversationId) {
        const matchesParam = userRole === 'CLIENT' 
          ? data.conversation.providerId === conversationParam
          : data.conversation.clientId === conversationParam;
        
        if (matchesParam) {
          setSelectedConversationId(data.conversation.id);
        }
      }
    };

    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, searchParams, selectedConversationId, userRole]);

  // Sync selected conversation with URL parameter (conversation)
  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    if (conversationParam && conversations.length > 0) {
      // Find conversation with this provider/client
      const existing = userRole === 'CLIENT'
        ? conversations.find((c) => c.providerId === conversationParam)
        : conversations.find((c) => c.clientId === conversationParam);
      
      if (existing) {
        // Select the existing conversation
        setSelectedConversationId(existing.id);
      } else {
        // No existing conversation - clear selection to show empty state
        setSelectedConversationId(null);
      }
    }
  }, [searchParams, conversations, userRole]);

  // Auto-create conversation when conversation parameter is in URL but no conversation exists
  const creatingConversationRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only clients can auto-create conversations
    if (userRole !== 'CLIENT') return;
    
    const conversationParam = searchParams.get('conversation');
    
    // Only proceed if we have a conversation parameter and conversations have loaded
    if (!conversationParam || loading) return;
    
    // Prevent duplicate creation
    if (creatingConversationRef.current === conversationParam) return;
    
    // Check if conversation already exists
    const existing = conversations.find((c) => c.providerId === conversationParam);
    if (existing) return; // Conversation already exists
    
    // Mark as creating
    creatingConversationRef.current = conversationParam;
    
    // Create empty conversation
    async function createEmptyConversation() {
      try {
        if (!conversationParam) return;
        
        const response = await api.messages.createConversation({ providerId: conversationParam });
        const newConversation = response.data.conversation;
        
        // Add to conversations list
        setConversations((prev) => [newConversation, ...prev]);
        
        // Select the new conversation
        setSelectedConversationId(newConversation.id);
      } catch (err: unknown) {
        console.error('Failed to create conversation:', err);
        // Reset creating flag on error
        creatingConversationRef.current = null;
      }
    }
    
    createEmptyConversation();
  }, [searchParams, loading, userRole, conversations]);

  async function fetchConversations() {
    try {
      setLoading(true);
      const res = await api.messages.getConversations();
      setConversations(res.data.conversations);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  function handleConversationSelect(conversationId: string) {
    setSelectedConversationId(conversationId);
    
    // Update URL with conversation parameter for cleaner URLs
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      const conversationParam = userRole === 'CLIENT' 
        ? conversation.providerId 
        : conversation.clientId;
      
      router.push(`${basePath}?conversation=${conversationParam}`, { scroll: false });
    }
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
        <p className="text-muted-foreground">
          {userRole === 'CLIENT' 
            ? 'Chat with your beauty professionals' 
            : 'Chat with your clients'}
        </p>
      </div>

      {/* Messages Container */}
      {conversations.length > 0 || searchParams.get('conversation') ? (
        <Card className="overflow-hidden border-0 md:border">
          <div className="flex h-[calc(100vh-16rem)]">
            {/* Conversations List - Left Sidebar */}
            <div 
              className={cn(
                "w-full md:w-80 border-r overflow-y-auto bg-background",
                selectedConversationId ? "hidden md:block" : "block"
              )}
            >
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleConversationSelect}
                userRole={userRole.toLowerCase() as 'client' | 'provider'}
              />
            </div>

            {/* Message Thread - Main Area */}
            <div 
              className={cn(
                "flex-1 flex flex-col bg-background",
                !selectedConversationId && !searchParams.get('conversation') ? "hidden md:flex" : "flex"
              )}
            >
              {selectedConversationId || searchParams.get('conversation') ? (
                <>
                  {/* Mobile Header with Back Button */}
                  <div className="md:hidden flex items-center p-4 border-b">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSelectedConversationId(null);
                        router.push(basePath, { scroll: false });
                      }}
                      className="gap-2 -ml-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                  <MessageThread
                    conversationId={selectedConversationId || undefined}
                    providerId={searchParams.get('conversation') || undefined}
                    showAIDrafts={userRole === 'PROVIDER'}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center p-6">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">
                      {userRole === 'CLIENT' 
                        ? 'Choose a provider to start chatting' 
                        : 'Choose a client to start chatting'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">
              {userRole === 'CLIENT' 
                ? 'Start a conversation with a provider by booking a service or sending them a message' 
                : 'Your clients will appear here when they message you'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
