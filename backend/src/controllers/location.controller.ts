/**
 * Location Controller
 * Handles multiple locations management endpoints
 */

import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { locationService } from '../services/location.service';
import type { AuthRequest } from '../types';
import type {
  CreateLocationRequest,
  UpdateLocationRequest,
  CreateLocationResponse,
  UpdateLocationResponse,
  GetLocationResponse,
  GetLocationsResponse,
  DeleteLocationResponse,
  ProviderLocation,
} from '../../../shared-types';

/**
 * Get all locations for provider
 */
export async function getLocations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const locations = await locationService.getLocations(userId);

    sendSuccess<GetLocationsResponse>(res, {
      message: 'Locations retrieved successfully',
      locations: locations as GetLocationsResponse['locations'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single location by ID
 */
export async function getLocation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const { locationId } = req.params;
    if (!locationId) throw new AppError(400, 'Location ID required');

    const location = await locationService.getLocation(userId, locationId);

    sendSuccess<GetLocationResponse>(res, {
      message: 'Location retrieved successfully',
      location: location as GetLocationResponse['location'],
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Location not found') {
      return next(new AppError(404, 'Location not found'));
    }
    next(error);
  }
}

/**
 * Create a new location
 */
export async function createLocation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      name: z.string().max(255).optional(),
      addressLine1: z.string().min(1).max(255),
      addressLine2: z.string().max(255).optional().nullable(),
      city: z.string().min(1).max(100),
      state: z.string().min(1).max(50),
      zipCode: z.string().min(1).max(20),
      country: z.string().min(1).max(50),
      businessPhone: z.string().max(20).optional().nullable(),
      latitude: z.number().min(-90).max(90).optional().nullable(),
      longitude: z.number().min(-180).max(180).optional().nullable(),
      isPrimary: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as CreateLocationRequest;

    const location = await locationService.createLocation(userId, data);

    sendSuccess<CreateLocationResponse>(res, {
      message: 'Location created successfully',
      location: location as CreateLocationResponse['location'],
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Update a location
 */
export async function updateLocation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const { locationId } = req.params;
    if (!locationId) throw new AppError(400, 'Location ID required');

    const schema = z.object({
      name: z.string().max(255).optional(),
      addressLine1: z.string().min(1).max(255).optional(),
      addressLine2: z.string().max(255).optional().nullable(),
      city: z.string().min(1).max(100).optional(),
      state: z.string().min(1).max(50).optional(),
      zipCode: z.string().min(1).max(20).optional(),
      country: z.string().min(1).max(50).optional(),
      businessPhone: z.string().max(20).optional().nullable(),
      latitude: z.number().min(-90).max(90).optional().nullable(),
      longitude: z.number().min(-180).max(180).optional().nullable(),
      isPrimary: z.boolean().optional(),
      isActive: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as UpdateLocationRequest;

    const location = await locationService.updateLocation(userId, locationId, data);

    sendSuccess<UpdateLocationResponse>(res, {
      message: 'Location updated successfully',
      location: location as UpdateLocationResponse['location'],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    if (error instanceof Error && error.message === 'Location not found') {
      return next(new AppError(404, 'Location not found'));
    }
    next(error);
  }
}

/**
 * Delete a location
 */
export async function deleteLocation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const { locationId } = req.params;
    if (!locationId) throw new AppError(400, 'Location ID required');

    await locationService.deleteLocation(userId, locationId);

    sendSuccess<DeleteLocationResponse>(res, {
      message: 'Location deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Location not found') {
      return next(new AppError(404, 'Location not found'));
    }
    next(error);
  }
}

