'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Calendar, Heart, MessageSquare, Search, X } from 'lucide-react';
import { NAV_LINKS } from '@/constants';

// Map icon names to actual icon components
const iconMap = {
  LayoutDashboard,
  Calendar,
  Heart,
  MessageSquare,
};

const navigation = NAV_LINKS.CLIENT_SIDEBAR.map((item) => ({
  ...item,
  icon: iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard,
}));

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientSidebar({ isOpen, onClose }: ClientSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/50 z-40 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 border-r bg-background flex flex-col h-full overflow-y-auto transition-transform duration-300 ease-in-out z-50',
          // Mobile: fixed position with slide animation
          'fixed md:relative inset-y-0 left-0',
          // Hidden by default on mobile, slide in when open
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <span className="text-lg font-heading font-bold text-primary">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <div className="p-4 md:p-6 flex-shrink-0">
          <Button variant="default" className="w-full gap-2" asChild onClick={onClose}>
            <Link href="/search">
              <Search className="h-4 w-4" />
              Browse Services
            </Link>
          </Button>
        </div>

        <nav className="px-4 pb-4 flex-1">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.label}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    pathname === item.href && 'bg-primary/10 text-primary'
                  )}
                  asChild
                  onClick={onClose}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
