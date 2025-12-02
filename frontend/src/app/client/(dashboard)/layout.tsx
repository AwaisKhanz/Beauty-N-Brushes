'use client';

import { useState } from 'react';
import { ClientHeader } from '@/components/client/ClientHeader';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';
import { GlobalNotificationListener } from '@/components/notifications/GlobalNotificationListener';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard requiredRole="CLIENT">
      <EmailVerificationGuard>
        <GlobalNotificationListener />
        <div className="flex h-screen flex-col bg-background">
          <ClientHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex flex-1 overflow-hidden">
            <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </EmailVerificationGuard>
    </AuthGuard>
  );
}
