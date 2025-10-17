import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="ADMIN">
      <EmailVerificationGuard>{children}</EmailVerificationGuard>
    </AuthGuard>
  );
}
