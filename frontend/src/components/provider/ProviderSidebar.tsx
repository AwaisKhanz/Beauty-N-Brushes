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
import { NAV_LINKS } from '@/constants';

// Map icon names to actual icon components
const iconMap = {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Package,
};

const navigation = NAV_LINKS.PROVIDER_SIDEBAR.map((item) => ({
  ...item,
  icon: iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard,
  children: item.children,
}));

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
