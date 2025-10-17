/**
 * Navigation links for different parts of the application
 */

export const NAV_LINKS = {
  PUBLIC: [
    { href: '/search', label: 'Browse Services' },
    { href: '/about', label: 'About' },
    { href: '/for-providers', label: 'For Providers' },
  ],

  PROVIDER_SIDEBAR: [
    {
      name: 'Dashboard',
      href: '/provider/dashboard',
      icon: 'LayoutDashboard',
    },
    {
      name: 'Services',
      href: '/provider/services',
      icon: 'Package',
      children: [
        { name: 'All Services', href: '/provider/services' },
        { name: 'Create Service', href: '/provider/services/create' },
      ],
    },
    {
      name: 'Bookings',
      href: '/provider/bookings',
      icon: 'Calendar',
    },
    {
      name: 'Calendar',
      href: '/provider/calendar',
      icon: 'Calendar',
    },
    {
      name: 'Clients',
      href: '/provider/clients',
      icon: 'Users',
    },
    {
      name: 'Messages',
      href: '/provider/messages',
      icon: 'MessageSquare',
    },
    {
      name: 'Analytics',
      href: '/provider/analytics',
      icon: 'BarChart3',
    },
    {
      name: 'Earnings',
      href: '/provider/earnings',
      icon: 'CreditCard',
    },
    {
      name: 'Settings',
      href: '/provider/settings',
      icon: 'Settings',
    },
  ],

  CLIENT_SIDEBAR: [
    {
      href: '/client/dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
    },
    {
      href: '/client/bookings',
      label: 'My Bookings',
      icon: 'Calendar',
    },
    {
      href: '/client/favorites',
      label: 'Favorites',
      icon: 'Heart',
    },
    {
      href: '/client/messages',
      label: 'Messages',
      icon: 'MessageSquare',
    },
  ],

  ADMIN_SIDEBAR: [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: 'Users',
    },
    {
      href: '/admin/providers',
      label: 'Providers',
      icon: 'Store',
    },
    {
      href: '/admin/bookings',
      label: 'Bookings',
      icon: 'Calendar',
    },
    {
      href: '/admin/reports',
      label: 'Reports',
      icon: 'FileText',
    },
  ],
} as const;
