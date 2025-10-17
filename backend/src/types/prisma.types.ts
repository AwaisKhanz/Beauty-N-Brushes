/**
 * Prisma Type Helpers
 * Reusable types for common Prisma query results with includes
 */

import { Prisma } from '@prisma/client';

// ============================================
// Service Types
// ============================================

/**
 * Service with all common relations (category, addons, media, provider with user)
 */
export type ServiceWithRelations = Prisma.ServiceGetPayload<{
  include: {
    category: true;
    addons: true;
    media: true;
    provider: {
      include: {
        user: true;
      };
    };
    _count: {
      select: {
        bookings: true;
      };
    };
  };
}>;

/**
 * Service with basic provider info only
 */
export type ServiceWithProvider = Prisma.ServiceGetPayload<{
  include: {
    provider: {
      select: {
        id: true;
        businessName: true;
        logoUrl: true;
        slug: true;
        regionCode: true;
        currency: true;
        user: {
          select: {
            avatarUrl: true;
          };
        };
      };
    };
    category: true;
    addons: true;
    media: true;
  };
}>;

// ============================================
// Provider Types
// ============================================

/**
 * Provider with user and services
 */
export type ProviderWithRelations = Prisma.ProviderProfileGetPayload<{
  include: {
    user: true;
    services: true;
  };
}>;

/**
 * Provider with full details including salon profile
 */
export type ProviderWithFullDetails = Prisma.ProviderProfileGetPayload<{
  include: {
    user: true;
    services: {
      include: {
        category: true;
        addons: true;
        media: true;
      };
    };
    salonProfile: true;
  };
}>;

/**
 * Provider with user only
 */
export type ProviderWithUser = Prisma.ProviderProfileGetPayload<{
  include: {
    user: true;
  };
}>;

// ============================================
// User Types
// ============================================

/**
 * User with provider profile
 */
export type UserWithProviderProfile = Prisma.UserGetPayload<{
  include: {
    providerProfile: true;
  };
}>;

/**
 * User with client profile
 */
export type UserWithClientProfile = Prisma.UserGetPayload<{
  include: {
    clientProfile: true;
    providerProfile: false;
  };
}>;

// ============================================
// Booking Types
// ============================================

/**
 * Booking with all relations
 */
export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    service: {
      include: {
        category: true;
        provider: {
          include: {
            user: true;
          };
        };
      };
    };
    clientProfile: {
      include: {
        user: true;
      };
    };
    providerProfile: {
      include: {
        user: true;
      };
    };
    bookingAddons: true;
  };
}>;
