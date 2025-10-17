'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="PROVIDER">
      <EmailVerificationGuard>
        <div className="min-h-screen bg-background">{children}</div>
      </EmailVerificationGuard>
    </AuthGuard>
  );
}
