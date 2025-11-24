'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

export default function CalendarIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for OAuth callback parameters
    const connectedParam = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connectedParam === 'true') {
      setSuccess('Google Calendar connected successfully!');
      setTimeout(() => setSuccess(''), 5000);
    }

    if (errorParam) {
      setError('Failed to connect Google Calendar. Please try again.');
      setTimeout(() => setError(''), 5000);
    }

    fetchCalendarStatus();
  }, [searchParams]);

  async function fetchCalendarStatus() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getCalendarStatus();
      const status = response.data;

      setConnected(status.connected);
      setEmail(status.email);
      setLastSyncAt(status.lastSyncAt);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load calendar status');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true);
      setError('');

      const response = await api.googleCalendar.connect();
      const authUrl = response.data.authUrl;

      // Redirect to Google OAuth page
      window.location.href = authUrl;
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to initiate connection');
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (
      !confirm(
        'Are you sure you want to disconnect Google Calendar? This will stop automatic syncing of bookings.'
      )
    ) {
      return;
    }

    try {
      setDisconnecting(true);
      setError('');
      setSuccess('');

      await api.googleCalendar.disconnect();
      setSuccess('Google Calendar disconnected successfully');
      setConnected(false);
      setEmail(null);
      setLastSyncAt(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to disconnect calendar');
    } finally {
      setDisconnecting(false);
    }
  }

  function formatLastSync(dateString: string | null) {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Calendar Integration"
        description="Connect Google Calendar for automatic sync"
      >
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Calendar Integration"
      description="Connect Google Calendar for automatic sync"
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Google Calendar
                </CardTitle>
                <CardDescription>Two-way sync for your bookings</CardDescription>
              </div>
              {connected ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {connected ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Connected Account:</span>
                    <span className="text-sm font-medium">{email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Sync:</span>
                    <span className="text-sm font-medium">{formatLastSync(lastSyncAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchCalendarStatus} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Status
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Connect your Google Calendar to automatically sync your bookings. When clients
                  book appointments, they'll appear on your calendar immediately.
                </p>
                <Button onClick={handleConnect} disabled={connecting} className="gap-2">
                  {connecting ? (
                    'Connecting...'
                  ) : (
                    <>
                      <CalendarIcon className="h-4 w-4" />
                      Connect Google Calendar
                      <ExternalLink className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Calendar Sync Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                <span>New bookings are automatically added to your Google Calendar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                <span>Cancellations and reschedules sync immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                <span>Client contact information included in event details</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                <span>Receive Google Calendar notifications and reminders</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                <span>Access your schedule from any device with Google Calendar</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We only access your calendar to create and manage booking events. We never read your
            personal calendar events or share your data with third parties.
          </AlertDescription>
        </Alert>
      </div>
    </SettingsLayout>
  );
}
