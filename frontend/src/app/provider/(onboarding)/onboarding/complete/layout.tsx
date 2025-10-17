'use client';

import { CompleteOnboardingGuard } from '@/components/auth/CompleteOnboardingGuard';

export default function OnboardingCompleteLayout({ children }: { children: React.ReactNode }) {
  return <CompleteOnboardingGuard>{children}</CompleteOnboardingGuard>;
}
