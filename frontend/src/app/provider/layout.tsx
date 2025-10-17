'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';
import { OnboardingGuard } from '@/components/auth/OnboardingGuard';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="PROVIDER">
      <EmailVerificationGuard>
        <OnboardingGuard>{children}</OnboardingGuard>
      </EmailVerificationGuard>
    </AuthGuard>
  );
}
