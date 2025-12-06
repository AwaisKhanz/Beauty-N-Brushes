'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Building2,
  Calendar,
  Shield,
  CreditCard,
  Bell,
  User,
  Users,
  ChevronRight,
  // Palette, // Temporarily hidden with Branding
} from 'lucide-react';
import Link from 'next/link';

const SETTINGS_SECTIONS = [
  {
    title: 'Business Profile',
    description: 'Manage your business information and social links',
    icon: Building2,
    href: '/provider/settings/profile',
  },
  // Temporarily hidden - Branding customization
  // {
  //   title: 'Branding',
  //   description: 'Customize your colors, fonts, and logo',
  //   icon: Palette,
  //   href: '/provider/settings/branding',
  // },
  // Temporarily hidden - Use "Locations" (plural) instead
  // {
  //   title: 'Location & Contact',
  //   description: 'Manage business address and contact information',
  //   icon: MapPin,
  //   href: '/provider/settings/location',
  // },
  // Removed - Multi-location feature removed to avoid confusion with onboarding address
  // {
  //   title: 'Locations',
  //   description: 'Manage multiple business locations',
  //   icon: MapPin,
  //   href: '/provider/settings/locations',
  // },
  // Temporarily hidden - Fields merged into Profile page
  // {
  //   title: 'Business Details',
  //   description: 'License, timezone, and verification status',
  //   icon: FileText,
  //   href: '/provider/settings/business-details',
  // },
  {
    title: 'Booking Settings',
    description: 'Configure booking windows, buffer times, and availability',
    icon: Calendar,
    href: '/provider/settings/booking',
  },
  // Temporarily hidden - Calendar Integration needs OAuth implementation
  // {
  //   title: 'Calendar Integration',
  //   description: 'Connect Google Calendar for automatic sync',
  //   icon: Calendar,
  //   href: '/provider/settings/calendar',
  // },
  {
    title: 'Team Management',
    description: 'Manage salon team members and permissions (Salon only)',
    icon: Users,
    href: '/provider/settings/team',
  },
  {
    title: 'Policies',
    description: 'Set cancellation, late arrival, and no-show policies',
    icon: Shield,
    href: '/provider/settings/policies',
  },
  {
    title: 'Subscription & Payment',
    description: 'Manage subscription plan and payment method',
    icon: CreditCard,
    href: '/provider/settings/subscription',
  },
  {
    title: 'Notifications',
    description: 'Control email and SMS notification preferences',
    icon: Bell,
    href: '/provider/settings/notifications',
  },
  {
    title: 'Account Settings',
    description: 'Update email, phone, password, or deactivate account',
    icon: User,
    href: '/provider/settings/account',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription className="mt-1">{section.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
