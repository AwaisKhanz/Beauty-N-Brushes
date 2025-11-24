'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ProfileForm } from '@/components/client/ProfileForm';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  hairType?: string | null;
  hairTexture?: string | null;
  hairPreferences?: string | null;
}

export default function ClientProfilePage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      setLoading(true);
      setError('');
      const res = await api.auth.me();
      setUserData(res.data.user);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-3xl font-heading font-bold">Profile</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Failed to load profile'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      {/* Profile Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={userData || undefined} onSuccess={fetchUserData} />
        </CardContent>
      </Card>
    </div>
  );
}
