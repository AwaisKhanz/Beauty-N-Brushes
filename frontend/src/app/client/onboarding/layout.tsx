import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';

export default function ClientOnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="CLIENT">
      <EmailVerificationGuard>{children}</EmailVerificationGuard>
    </AuthGuard>
  );
}
