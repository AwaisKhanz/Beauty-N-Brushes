'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { GuardLoading } from '@/components/auth/GuardLoading';
import { ROUTES } from '@/constants';
import { extractErrorMessage } from '@/lib/error-utils';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

export function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
  const { user, loading, isAuthenticated, resendVerification } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // If email is verified, show children
    if (user?.emailVerified) {
      return;
    }
  }, [loading, isAuthenticated, user, router]);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      await resendVerification(user.email);
      setResendSuccess(true);
    } catch (error: unknown) {
      setResendError(extractErrorMessage(error) || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  if (loading) {
    return <GuardLoading message="Verifying account..." />;
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If email is verified, show children
  if (user?.emailVerified) {
    return <>{children}</>;
  }

  // Show email verification prompt
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{user?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Please check your email and click the verification link to continue.
              </p>
              <p className="text-xs text-muted-foreground">
                Don't see the email? Check your spam folder.
              </p>
            </div>

            {resendSuccess && (
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Verification email sent! Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            {resendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resendError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
                variant="outline"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Button>

              <Button onClick={() => router.push(ROUTES.LOGIN)} variant="ghost" className="w-full">
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
