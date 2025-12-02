'use client';

import { MessagesContainer } from '@/components/messages/MessagesContainer';
import { useSocket } from '@/contexts/SocketContext';

export default function ProviderMessagesPage() {
  const { socket } = useSocket();

  if (!socket) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Connecting to messaging service...</p>
      </div>
    );
  }

  return <MessagesContainer userRole="PROVIDER" basePath="/provider/messages" />;
}
