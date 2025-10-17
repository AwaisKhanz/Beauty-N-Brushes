'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  Search,
  ArrowLeft,
  AlertCircle,
  LayoutDashboard,
  User,
  Settings,
  Heart,
} from 'lucide-react';

export default function NotFound() {
  const pathname = usePathname();

  // Detect which section the user is in
  const isProviderSection = pathname?.startsWith('/provider');
  const isClientSection = pathname?.startsWith('/client');
  const isAdminSection = pathname?.startsWith('/admin');

  // Determine appropriate navigation based on section
  const getPrimaryAction = () => {
    if (isProviderSection) {
      return {
        href: '/provider/dashboard',
        label: 'Provider Dashboard',
        icon: LayoutDashboard,
      };
    }
    if (isClientSection) {
      return {
        href: '/client/dashboard',
        label: 'My Dashboard',
        icon: User,
      };
    }
    if (isAdminSection) {
      return {
        href: '/admin/dashboard',
        label: 'Admin Dashboard',
        icon: LayoutDashboard,
      };
    }
    return {
      href: '/',
      label: 'Go Home',
      icon: Home,
    };
  };

  const getSecondaryAction = () => {
    if (isProviderSection) {
      return {
        href: '/provider/services',
        label: 'My Services',
        icon: Settings,
      };
    }
    if (isClientSection || isAdminSection) {
      return {
        href: '/search',
        label: 'Find Services',
        icon: Heart,
      };
    }
    return {
      href: '/search',
      label: 'Browse Services',
      icon: Search,
    };
  };

  const getMessage = () => {
    if (isProviderSection) {
      return "This page doesn't exist in your provider dashboard. Let's get you back to managing your beauty services!";
    }
    if (isClientSection) {
      return "This page doesn't exist in your client area. Let's get you back to discovering amazing beauty services!";
    }
    if (isAdminSection) {
      return "This page doesn't exist in the admin panel. Let's get you back to managing the platform!";
    }
    return "The page you're looking for seems to have vanished into thin air. Don't worry, even the best beauty transformations need a little touch-up sometimes!";
  };

  const getFooterLink = () => {
    if (isProviderSection) {
      return {
        href: '/provider/settings',
        label: 'settings',
      };
    }
    if (isClientSection) {
      return {
        href: '/client/settings',
        label: 'settings',
      };
    }
    if (isAdminSection) {
      return {
        href: '/admin/settings',
        label: 'settings',
      };
    }
    return {
      href: '/about',
      label: 'about page',
    };
  };

  const primaryAction = getPrimaryAction();
  const secondaryAction = getSecondaryAction();
  const footerLink = getFooterLink();
  const PrimaryIcon = primaryAction.icon;
  const SecondaryIcon = secondaryAction.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-bold">404</CardTitle>
              <CardDescription className="text-lg">
                {isProviderSection || isClientSection || isAdminSection
                  ? 'Page Not Found'
                  : 'Oops! Page Not Found'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">{getMessage()}</p>

            <Separator />

            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href={primaryAction.href}>
                  <PrimaryIcon className="mr-2 h-4 w-4" />
                  {primaryAction.label}
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href={secondaryAction.href}>
                  <SecondaryIcon className="mr-2 h-4 w-4" />
                  {secondaryAction.label}
                </Link>
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.back();
                  }
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            <Separator />

            <p className="text-center text-sm text-muted-foreground">
              Need help?{' '}
              {isProviderSection || isClientSection || isAdminSection
                ? 'Check your'
                : 'Contact our support team or visit our'}{' '}
              <Link href={footerLink.href} className="text-primary hover:underline font-medium">
                {footerLink.label}
              </Link>
              {isProviderSection || isClientSection || isAdminSection ? ' or contact support' : ''}.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
