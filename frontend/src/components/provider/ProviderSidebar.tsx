'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Package,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/provider/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Services',
    href: '/provider/services',
    icon: Package,
    children: [
      { name: 'All Services', href: '/provider/services' },
      { name: 'Create Service', href: '/provider/services/create' },
    ],
  },
  {
    name: 'Bookings',
    href: '/provider/bookings',
    icon: Calendar,
  },
  {
    name: 'Calendar',
    href: '/provider/calendar',
    icon: Calendar,
  },
  {
    name: 'Clients',
    href: '/provider/clients',
    icon: Users,
  },
  {
    name: 'Messages',
    href: '/provider/messages',
    icon: MessageSquare,
  },
  {
    name: 'Analytics',
    href: '/provider/analytics',
    icon: BarChart3,
  },
  {
    name: 'Earnings',
    href: '/provider/earnings',
    icon: CreditCard,
  },
  {
    name: 'Settings',
    href: '/provider/settings',
    icon: Settings,
  },
];

export default function ProviderSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-background">
      <div className="p-6">
        <Button variant="default" className="w-full gap-2" asChild>
          <Link href="/provider/services/create">
            <Plus className="h-4 w-4" />
            Create Service
          </Link>
        </Button>
      </div>

      <nav className="px-4 pb-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  pathname === item.href && 'bg-primary/10 text-primary'
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
