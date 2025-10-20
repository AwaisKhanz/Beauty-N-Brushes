'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

type VerificationStatus = 'verifying' | 'success' | 'error';

export default function VerifyEmailTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { checkAuth } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid verification link');
      return;
    }

    // Only verify once
    if (hasVerified.current) return;
    hasVerified.current = true;

    verifyEmailToken();
  }, []);

  const verifyEmailToken = async () => {
    try {
      setStatus('verifying');

      const response = await api.auth.verifyEmail(token);

      if (response && response.success) {
        setStatus('success');

        // Refresh auth state
        await checkAuth();

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setErrorMessage('Verification failed. Please try again.');
      }
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(
        extractErrorMessage(error) || 'Verification failed. The link may be invalid or expired.'
      );
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      router.push('/login?verified=true');
    } else {
      router.push('/verify-email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              {status === 'verifying' && (
                <>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <CardTitle>Verifying Your Email</CardTitle>
                  <CardDescription>
                    Please wait while we verify your email address...
                  </CardDescription>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-primary">Email Verified!</CardTitle>
                  <CardDescription>Your email has been successfully verified</CardDescription>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle className="text-destructive">Verification Failed</CardTitle>
                  <CardDescription>{errorMessage}</CardDescription>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-primary/10 text-primary rounded-lg p-4 text-sm border border-primary/20">
                  <p>
                    Your email address has been verified. You can now log in and start your
                    onboarding process.
                  </p>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Redirecting to login in 3 seconds...
                </p>

                <Button onClick={handleContinue} className="w-full">
                  Continue to Login
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm border border-destructive/20">
                  <p className="font-medium mb-2">Common reasons for verification failure:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>The verification link has expired (24 hours)</li>
                    <li>The link has already been used</li>
                    <li>The link is incomplete or corrupted</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => router.push('/verify-email')} className="w-full">
                    Request New Verification Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            )}

            {status === 'verifying' && (
              <div className="flex items-center justify-center py-8">
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {status !== 'verifying' && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact us at support@beautynbrushes.com
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
