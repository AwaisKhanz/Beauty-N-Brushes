/**
 * Saved Search Controller
 * Handles HTTP requests for saved search operations
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { savedSearchService } from '../services/savedSearch.service';
import type { AuthRequest } from '../types';
import type {
  CreateSavedSearchRequest,
  CreateSavedSearchResponse,
  GetSavedSearchesResponse,
  GetSavedSearchResponse,
  UpdateSavedSearchRequest,
  UpdateSavedSearchResponse,
  DeleteSavedSearchResponse,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Create a new saved search
 * POST /api/v1/saved-searches
 */
export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      name: z.string().min(1, 'Search name is required').max(100),
      filters: z
        .object({
          query: z.string().optional(),
          category: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
        })
        .optional(),
      alertsEnabled: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as CreateSavedSearchRequest;

    const savedSearch = await savedSearchService.createSavedSearch(userId, data);

    sendSuccess<CreateSavedSearchResponse>(
      res,
      {
        message: 'Search saved successfully',
        savedSearch,
      },
      201
    );
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
 * Get all saved searches for current user
 * GET /api/v1/saved-searches
 */
export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await savedSearchService.getSavedSearches(userId);

    sendSuccess<GetSavedSearchesResponse>(res, {
      message: 'Saved searches retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single saved search by ID
 * GET /api/v1/saved-searches/:searchId
 */
export async function getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { searchId } = req.params;

    if (!searchId) {
      throw new AppError(400, 'Search ID required');
    }

    const savedSearch = await savedSearchService.getSavedSearchById(searchId, userId);

    sendSuccess<GetSavedSearchResponse>(res, {
      message: 'Saved search retrieved successfully',
      savedSearch,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a saved search
 * PUT /api/v1/saved-searches/:searchId
 */
export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { searchId } = req.params;
    const data: UpdateSavedSearchRequest = req.body;

    if (!searchId) {
      throw new AppError(400, 'Search ID required');
    }

    const savedSearch = await savedSearchService.updateSavedSearch(searchId, userId, data);

    sendSuccess<UpdateSavedSearchResponse>(res, {
      message: 'Saved search updated successfully',
      savedSearch,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a saved search
 * DELETE /api/v1/saved-searches/:searchId
 */
export async function remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { searchId } = req.params;

    if (!searchId) {
      throw new AppError(400, 'Search ID required');
    }

    await savedSearchService.deleteSavedSearch(searchId, userId);

    sendSuccess<DeleteSavedSearchResponse>(res, {
      message: 'Saved search deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
