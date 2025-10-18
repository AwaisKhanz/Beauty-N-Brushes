'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Calendar, Shield, CreditCard, Bell, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const SETTINGS_SECTIONS = [
  {
    title: 'Business Profile',
    description: 'Manage your business information, branding, and social links',
    icon: Building2,
    href: '/provider/settings/profile',
  },
  {
    title: 'Booking Settings',
    description: 'Configure booking windows, buffer times, and availability',
    icon: Calendar,
    href: '/provider/settings/booking',
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
