'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="CLIENT">
      <EmailVerificationGuard>{children}</EmailVerificationGuard>
    </AuthGuard>
  );
}
