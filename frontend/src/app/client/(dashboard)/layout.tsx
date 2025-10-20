'use client';

import { useState } from 'react';
import { ClientHeader } from '@/components/client/ClientHeader';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard requiredRole="CLIENT">
      <EmailVerificationGuard>
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
