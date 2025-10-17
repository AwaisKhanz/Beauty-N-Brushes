/**
 * Service-related constants
 * Shared between frontend and backend
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
  { id: 'hair', name: 'Hair Services', slug: 'hair' },
  { id: 'makeup', name: 'Makeup Services', slug: 'makeup' },
  { id: 'nails', name: 'Nail Services', slug: 'nails' },
  { id: 'skincare', name: 'Skincare Services', slug: 'skincare' },
  { id: 'lashes', name: 'Lash Services', slug: 'lashes' },
  { id: 'brows', name: 'Brow Services', slug: 'brows' },
  { id: 'waxing', name: 'Waxing Services', slug: 'waxing' },
  { id: 'bridal', name: 'Bridal Services', slug: 'bridal' },
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

// Helper types
export type ServiceSpecialization = (typeof SERVICE_SPECIALIZATIONS)[number];
export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]['id'];
export type BusinessType = (typeof BUSINESS_TYPES)[number]['value'];
export type DepositType = (typeof DEPOSIT_TYPES)[number]['value'];
