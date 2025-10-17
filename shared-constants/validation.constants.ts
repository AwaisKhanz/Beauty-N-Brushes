/**
 * Validation constants
 * Shared between frontend and backend
 */

export const VALIDATION_LIMITS = {
  // Business Details
  BUSINESS_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  BIO: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 500,
  },

  // Service
  SERVICE_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255,
  },
  SERVICE_DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 2000,
  },
  SERVICE_DURATION: {
    MIN_MINUTES: 15,
    MAX_MINUTES: 480, // 8 hours
  },

  // Pricing
  PRICE: {
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 10000,
  },

  // Media
  MEDIA: {
    MAX_PROFILE_IMAGES: 5,
    MAX_SERVICE_IMAGES: 10,
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },

  // Booking
  BOOKING: {
    MIN_ADVANCE_HOURS: 1,
    MAX_ADVANCE_DAYS: 90,
    DEFAULT_ADVANCE_HOURS: 24,
  },

  // Salon
  SALON: {
    MIN_TEAM_MEMBERS: 1,
    MAX_TEAM_MEMBERS: 10,
  },
} as const;
