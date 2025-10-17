'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function ProviderDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="lg" showText />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">
              Welcome, {user?.firstName}!
            </h2>
            <p className="text-muted-foreground mt-2">Manage your beauty business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Today's Bookings</CardTitle>
                <CardDescription>Appointments today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">0</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-accent">Active Services</CardTitle>
                <CardDescription>Published services</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">0</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-secondary">This Month</CardTitle>
                <CardDescription>Total revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">$0</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="dark">Add Service</Button>
              <Button variant="outline">View Calendar</Button>
              <Button variant="outline">Manage Profile</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
