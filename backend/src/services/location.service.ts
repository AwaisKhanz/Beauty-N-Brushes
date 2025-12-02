/**
 * Location Service
 * Manages provider multiple locations
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { geocodingService } from '../lib/geocoding';
import type {
  CreateLocationRequest,
  UpdateLocationManagementRequest,
  ProviderLocation,
} from '../../../shared-types';

class LocationService {
  /**
   * Get all locations for a provider
   */
  async getLocations(userId: string): Promise<ProviderLocation[]> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const locations = await prisma.providerLocation.findMany({
      where: { providerId: profile.id },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return locations.map((loc) => ({
      id: loc.id,
      providerId: loc.providerId,
      name: loc.name,
      addressLine1: loc.addressLine1,
      addressLine2: loc.addressLine2,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      country: loc.country,
      latitude: loc.latitude ? Number(loc.latitude) : null,
      longitude: loc.longitude ? Number(loc.longitude) : null,
      businessPhone: loc.businessPhone,
      isPrimary: loc.isPrimary,
      isActive: loc.isActive,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
    }));
  }

  /**
   * Get a single location by ID
   */
  async getLocation(userId: string, locationId: string): Promise<ProviderLocation> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const location = await prisma.providerLocation.findFirst({
      where: {
        id: locationId,
        providerId: profile.id,
      },
    });

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    return {
      id: location.id,
      providerId: location.providerId,
      name: location.name,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      country: location.country,
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      businessPhone: location.businessPhone,
      isPrimary: location.isPrimary,
      isActive: location.isActive,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }

  /**
   * Create a new location
   */
  async createLocation(userId: string, data: CreateLocationRequest): Promise<ProviderLocation> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Geocode address if coordinates are not provided
    let latitude = data.latitude;
    let longitude = data.longitude;

    if (
      (latitude === undefined || longitude === undefined || latitude === null || longitude === null) &&
      data.addressLine1 &&
      data.city &&
      data.state &&
      data.country
    ) {
      try {
        const geocodingResult = await geocodingService.geocodeAddressComponents({
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || undefined,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode || undefined,
          country: data.country,
        });

        if (geocodingResult) {
          latitude = geocodingResult.latitude;
          longitude = geocodingResult.longitude;
        }
      } catch (error) {
        console.warn('Geocoding failed for location:', error);
      }
    }

    // If this is marked as primary, unset other primary locations
    if (data.isPrimary) {
      await prisma.providerLocation.updateMany({
        where: {
          providerId: profile.id,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const location = await prisma.providerLocation.create({
      data: {
        providerId: profile.id,
        name: data.name || null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        latitude: latitude || null,
        longitude: longitude || null,
        businessPhone: data.businessPhone || null,
        isPrimary: data.isPrimary || false,
        isActive: true,
      },
    });

    return {
      id: location.id,
      providerId: location.providerId,
      name: location.name,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      country: location.country,
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      businessPhone: location.businessPhone,
      isPrimary: location.isPrimary,
      isActive: location.isActive,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }

  /**
   * Update a location
   */
  async updateLocation(
    userId: string,
    locationId: string,
    data: UpdateLocationManagementRequest
  ): Promise<ProviderLocation> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Verify location belongs to provider
    const existingLocation = await prisma.providerLocation.findFirst({
      where: {
        id: locationId,
        providerId: profile.id,
      },
    });

    if (!existingLocation) {
      throw new AppError(404, 'Location not found');
    }

    // Geocode address if coordinates are not provided but address changed
    let latitude = data.latitude;
    let longitude = data.longitude;

    if (
      (latitude === undefined || longitude === undefined || latitude === null || longitude === null) &&
      (data.addressLine1 || data.city || data.state || data.country)
    ) {
      const addressLine1 = data.addressLine1 || existingLocation.addressLine1;
      const city = data.city || existingLocation.city;
      const state = data.state || existingLocation.state;
      const country = data.country || existingLocation.country;
      const addressLine2 = data.addressLine2 !== undefined ? data.addressLine2 : existingLocation.addressLine2;
      const zipCode = data.zipCode || existingLocation.zipCode;

      try {
        const geocodingResult = await geocodingService.geocodeAddressComponents({
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state,
          zipCode: zipCode || undefined,
          country,
        });

        if (geocodingResult) {
          latitude = geocodingResult.latitude;
          longitude = geocodingResult.longitude;
        }
      } catch (error) {
        console.warn('Geocoding failed for location update:', error);
      }
    }

    // If this is marked as primary, unset other primary locations
    if (data.isPrimary === true) {
      await prisma.providerLocation.updateMany({
        where: {
          providerId: profile.id,
          id: { not: locationId },
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const location = await prisma.providerLocation.update({
      where: { id: locationId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
        ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.businessPhone !== undefined && { businessPhone: data.businessPhone }),
        ...(latitude !== undefined && latitude !== null && { latitude }),
        ...(longitude !== undefined && longitude !== null && { longitude }),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });

    return {
      id: location.id,
      providerId: location.providerId,
      name: location.name,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      country: location.country,
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      businessPhone: location.businessPhone,
      isPrimary: location.isPrimary,
      isActive: location.isActive,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }

  /**
   * Delete a location
   */
  async deleteLocation(userId: string, locationId: string): Promise<void> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Verify location belongs to provider
    const location = await prisma.providerLocation.findFirst({
      where: {
        id: locationId,
        providerId: profile.id,
      },
    });

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    await prisma.providerLocation.delete({
      where: { id: locationId },
    });
  }
}

export const locationService = new LocationService();

