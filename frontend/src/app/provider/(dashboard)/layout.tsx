'use client';

import { useState } from 'react';
import ProviderHeader from '@/components/provider/ProviderHeader';
import ProviderSidebar from '@/components/provider/ProviderSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';
import { OnboardingGuard } from '@/components/auth/OnboardingGuard';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard requiredRole="PROVIDER">
      <EmailVerificationGuard>
        <OnboardingGuard>
          <div className="flex h-screen flex-col bg-background">
            <ProviderHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1 overflow-hidden">
              <ProviderSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
            </div>
          </div>
        </OnboardingGuard>
      </EmailVerificationGuard>
    </AuthGuard>
  );
}
