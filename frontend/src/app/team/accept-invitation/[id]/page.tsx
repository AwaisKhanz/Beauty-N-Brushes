'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, UserPlus, Building2, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

interface InvitationDetails {
  id: string;
  salonName: string;
  role: string;
  invitedEmail: string;
  invitedAt: string;
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);

  useEffect(() => {
    fetchInvitationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId]);

  async function fetchInvitationDetails() {
    try {
      setLoading(true);
      setError('');

      // Get invitation details
      const response = await api.team.getInvitation(invitationId);
      setInvitation(response.data.invitation);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err);
      
      if (errorMsg?.includes('not found')) {
        setError('This invitation link is invalid or has expired.');
      } else if (errorMsg?.includes('already accepted')) {
        setError('This invitation has already been accepted.');
      } else if (errorMsg?.includes('Network Error') || errorMsg?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMsg || 'Failed to load invitation details');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    try {
      setAccepting(true);
      setError('');

      await api.team.acceptInvitation(invitationId);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/provider/dashboard');
      }, 2000);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err);
      
      if (errorMsg?.includes('must be logged in')) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/team/accept-invitation/${invitationId}`);
      } else if (errorMsg?.includes('Network Error') || errorMsg?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMsg || 'Failed to accept invitation');
      }
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      await api.team.declineInvitation(invitationId);
      router.push('/');
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to decline invitation');
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
            <CardTitle>Invitation Accepted!</CardTitle>
            <CardDescription>
              You've successfully joined the team. Redirecting to your dashboard...
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a salon team
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {invitation && (
            <>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Salon</p>
                    <p className="font-semibold">{invitation.salonName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <p className="font-semibold capitalize">{invitation.role}</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground text-center">
                  Invited to: {invitation.invitedEmail}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full"
                  size="lg"
                >
                  {accepting ? 'Accepting...' : 'Accept Invitation'}
                </Button>

                <Button
                  onClick={handleDecline}
                  disabled={accepting}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Decline
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By accepting, you'll be able to manage bookings and services for {invitation.salonName}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
