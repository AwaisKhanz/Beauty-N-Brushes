import ProviderHeader from '@/components/provider/ProviderHeader';
import ProviderSidebar from '@/components/provider/ProviderSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';
import { OnboardingGuard } from '@/components/auth/OnboardingGuard';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="PROVIDER">
      <EmailVerificationGuard>
        <OnboardingGuard>
          <div className="min-h-screen bg-background">
            <ProviderHeader />
            <div className="flex">
              <ProviderSidebar />
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        </OnboardingGuard>
      </EmailVerificationGuard>
    </AuthGuard>
  );
}
