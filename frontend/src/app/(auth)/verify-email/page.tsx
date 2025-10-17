'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/lib/error-utils';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const { resendVerification } = useAuth();

  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      // If no email, redirect to login
      router.push('/login');
    }
  }, [email, router]);

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);

    try {
      await resendVerification(email!);
      toast.success('Verification email sent', {
        description: 'Please check your inbox and spam folder',
      });
    } catch (error: unknown) {
      toast.error('Failed to resend email', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Check Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a verification link to your email address
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify Your Email Address</CardTitle>
            <CardDescription>A verification email has been sent to:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-base px-4 py-2">
                {email}
              </Badge>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-primary-foreground">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your inbox (and spam folder) for the verification email
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-primary-foreground">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the verification link in the email
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-primary-foreground">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to continue your onboarding
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">Didn't receive the email?</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            The verification link will expire in 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
