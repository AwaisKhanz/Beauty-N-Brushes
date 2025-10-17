/**
 * Onboarding flow constants
 */

export const ONBOARDING_STEPS = [
  { id: 1, label: 'Account Type', description: 'Choose solo or salon', completed: false },
  {
    id: 2,
    label: 'Business Details',
    description: 'Tell us about your business',
    completed: false,
  },
  { id: 3, label: 'Profile Media', description: 'Upload photos', completed: false },
  { id: 4, label: 'Brand Customization', description: 'Customize your colors', completed: false },
  { id: 5, label: 'Policies', description: 'Set business policies', completed: false },
  { id: 6, label: 'Payment Setup', description: 'Setup subscription', completed: false },
  { id: 7, label: 'Services', description: 'Create your first service', completed: false },
  { id: 8, label: 'Availability', description: 'Set your schedule', completed: false },
] as const;

export const ONBOARDING_STORAGE_KEY = 'onboarding_current_step';

export const STEP_LABELS = {
  accountType: 'Account Type',
  businessDetails: 'Business Details',
  profileMedia: 'Profile Media',
  brandCustomization: 'Brand Customization',
  policies: 'Business Policies',
  paymentSetup: 'Payment Setup',
  serviceCreated: 'Create Service',
  availabilitySet: 'Set Availability',
} as const;
