'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, UserPlus, Building2, Briefcase, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/lib/error-utils';

interface InvitationDetails {
  id: string;
  salonName: string;
  role: string;
  invitedEmail: string;
  invitedAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;
  const { user: authUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [emailMismatch, setEmailMismatch] = useState(false);

  useEffect(() => {
    loadInvitationAndCheckAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId, authUser]);

  async function loadInvitationAndCheckAuth() {
    try {
      setLoading(true);
      setError('');

      // Get invitation details
      const invitationResponse = await api.team.getInvitation(invitationId);
      const invitationData = invitationResponse.data.invitation;
      setInvitation(invitationData);

      // Check if user is authenticated
      if (!authUser) {
        // Not logged in - redirect to signup with invitation context
        const signupUrl = `/register?invitation=${invitationId}&email=${encodeURIComponent(
          invitationData.invitedEmail
        )}&salon=${encodeURIComponent(invitationData.salonName)}&role=${encodeURIComponent(
          invitationData.role
        )}`;
        router.push(signupUrl);
        return;
      }

      setCurrentUser({
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
      });

      // Check if email matches
      if (authUser.email.toLowerCase() === invitationData.invitedEmail.toLowerCase()) {
        // Email matches - auto-accept invitation
        await autoAcceptInvitation();
      } else {
        // Email mismatch
        setEmailMismatch(true);
        setError(
          `This invitation was sent to ${invitationData.invitedEmail}. You are currently logged in as ${authUser.email}.`
        );
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err);

      if (errorMsg?.includes('not found')) {
        setError('This invitation link is invalid or has expired.');
      } else if (errorMsg?.includes('already accepted')) {
        setError('This invitation has already been accepted.');
      } else {
        setError(errorMsg || 'Failed to load invitation details');
      }
    } finally {
      setLoading(false);
    }
  }

  async function autoAcceptInvitation() {
    try {
      setError('');

      await api.team.acceptInvitation(invitationId);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/provider/dashboard');
      }, 2000);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err);

      if (errorMsg?.includes('different email address') || errorMsg?.includes('invited email')) {
        setEmailMismatch(true);
        setError(
          `This invitation was sent to ${invitation?.invitedEmail}. Please log out and sign in with that email address.`
        );
      } else if (errorMsg?.includes('already accepted')) {
        setError(
          'This invitation has already been accepted. If you are the invited team member, please log in to access your dashboard.'
        );
      } else {
        setError(errorMsg || 'Failed to accept invitation');
      }
    }
  }

  async function handleLogout() {
    try {
      await logout();
      // Reload page to trigger redirect to signup
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined {invitation?.salonName}. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email mismatch state
  if (emailMismatch && currentUser && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Email Mismatch</CardTitle>
            <CardDescription>This invitation cannot be accepted with your current account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invited to</p>
                  <p className="font-semibold">{invitation.salonName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invited email</p>
                  <p className="font-semibold">{invitation.invitedEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <UserPlus className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currently logged in as</p>
                  <p className="font-semibold">{currentUser.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                To accept this invitation, you need to:
              </p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Log out of your current account</li>
                <li>Sign in with {invitation.invitedEmail}</li>
                <li>Or create a new account using {invitation.invitedEmail}</li>
              </ol>

              <Button onClick={handleLogout} variant="default" className="w-full gap-2" size="lg">
                <LogOut className="h-4 w-4" />
                Log Out and Continue
              </Button>

              <Button onClick={() => router.push('/')} variant="outline" className="w-full" size="lg">
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Accepting state (should not normally be visible due to auto-accept)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <CardTitle>Accepting Invitation...</CardTitle>
          <CardDescription>Please wait while we process your invitation</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
