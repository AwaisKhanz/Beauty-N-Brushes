'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '../../../../shared-types/message.types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  userRole: 'client' | 'provider';
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  userRole,
}: ConversationListProps) {
  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        // Role-aware display logic
        const displayName =
          userRole === 'client'
            ? conversation.provider?.businessName || 'Provider'
            : `${conversation.client?.firstName || ''} ${conversation.client?.lastName || ''}`.trim() ||
              'Client';

        const avatarUrl =
          userRole === 'client' ? conversation.provider?.logoUrl : conversation.client?.avatarUrl;

        const unreadCount =
          userRole === 'client' ? conversation.clientUnreadCount : conversation.providerUnreadCount;

        const firstLetter =
          userRole === 'client'
            ? conversation.provider?.businessName?.charAt(0) || 'P'
            : conversation.client?.firstName?.charAt(0) || 'C';

        return (
          <Button
            key={conversation.id}
            variant="ghost"
            className={cn(
              'w-full justify-start p-4 h-auto rounded-none hover:bg-muted/50 transition-colors',
              selectedConversationId === conversation.id && 'bg-primary/10 hover:bg-primary/15 border-l-4 border-primary'
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-start gap-3 w-full text-left">
              {/* Avatar/Logo */}
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-heading font-bold text-primary">{firstLetter}</span>
                </div>
              )}

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium truncate">{displayName}</span>
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>

                {conversation.lastMessagePreview ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {conversation.lastMessagePreview}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No messages yet
                  </p>
                )}

                {unreadCount > 0 && (
                  <Badge variant="default" className="mt-2">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
