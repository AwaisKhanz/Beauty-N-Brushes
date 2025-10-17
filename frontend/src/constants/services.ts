/**
 * Service-related constants
 */

export const SERVICE_SPECIALIZATIONS = [
  'Hair Styling & Cutting',
  'Hair Coloring & Highlights',
  'Braids & Extensions',
  'Makeup Artistry',
  'Nail Services',
  'Lash Services',
  'Brow Services',
  'Skincare & Facials',
  'Waxing Services',
  'Bridal Services',
  'Special Event Styling',
  'Hair Treatments',
] as const;

export const SERVICE_CATEGORIES = [
  { id: 'hair', name: 'Hair Services' },
  { id: 'makeup', name: 'Makeup Services' },
  { id: 'nails', name: 'Nail Services' },
  { id: 'skincare', name: 'Skincare Services' },
  { id: 'lashes', name: 'Lash Services' },
  { id: 'brows', name: 'Brow Services' },
  { id: 'waxing', name: 'Waxing Services' },
  { id: 'bridal', name: 'Bridal Services' },
] as const;

export const BUSINESS_TYPES = [
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'home-based', label: 'Home-Based' },
  { value: 'mobile', label: 'Mobile Service' },
  { value: 'studio', label: 'Studio' },
  { value: 'other', label: 'Other' },
] as const;

export const DEPOSIT_TYPES = [
  { value: 'percentage', label: 'Percentage of Service Price' },
  { value: 'fixed', label: 'Fixed Amount' },
] as const;
