'use client';

import { Logo } from '@/components/shared/Logo';
import { Loader2 } from 'lucide-react';

interface GuardLoadingProps {
  message?: string;
}

/**
 * Consistent loading component used across all guard components.
 * Shows Beauty N Brushes logo and loading spinner.
 */
export function GuardLoading({ message = 'Loading...' }: GuardLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Loading Spinner */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <Loader2 className="h-12 w-12 text-primary animate-spin relative" />
          </div>

          {/* Loading Message */}
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  );
}
