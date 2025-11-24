/**
 * Saved Search Service
 * Handles saving and managing client search queries
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type {
  SavedSearch,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
} from '../../../shared-types';

export const savedSearchService = {
  /**
   * Create a new saved search
   */
  async createSavedSearch(clientId: string, data: CreateSavedSearchRequest): Promise<SavedSearch> {
    const savedSearch = await prisma.savedSearch.create({
      data: {
        clientId,
        searchName: data.searchName || null,
        categoryId: data.categoryId || null,
        locationCity: data.locationCity || null,
        locationState: data.locationState || null,
        maxDistanceMiles: data.maxDistanceMiles || null,
        priceMin: data.priceMin || null,
        priceMax: data.priceMax || null,
        notifyNewMatches: data.notifyNewMatches || false,
      },
    });

    return this.formatSavedSearch(savedSearch);
  },

  /**
   * Get all saved searches for a client
   */
  async getSavedSearches(
    clientId: string
  ): Promise<{ savedSearches: SavedSearch[]; total: number }> {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      savedSearches: savedSearches.map((s: any) => this.formatSavedSearch(s)),
      total: savedSearches.length,
    };
  },

  /**
   * Get a single saved search by ID
   */
  async getSavedSearchById(searchId: string, clientId: string): Promise<SavedSearch> {
    const savedSearch = await prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!savedSearch) {
      throw new AppError(404, 'Saved search not found');
    }

    if (savedSearch.clientId !== clientId) {
      throw new AppError(403, 'Not authorized to access this saved search');
    }

    return this.formatSavedSearch(savedSearch);
  },

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    searchId: string,
    clientId: string,
    data: UpdateSavedSearchRequest
  ): Promise<SavedSearch> {
    // Verify ownership
    const existing = await prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!existing) {
      throw new AppError(404, 'Saved search not found');
    }

    if (existing.clientId !== clientId) {
      throw new AppError(403, 'Not authorized to update this saved search');
    }

    const updatedSearch = await prisma.savedSearch.update({
      where: { id: searchId },
      data: {
        searchName: data.searchName !== undefined ? data.searchName : undefined,
        notifyNewMatches: data.notifyNewMatches !== undefined ? data.notifyNewMatches : undefined,
      },
    });

    return this.formatSavedSearch(updatedSearch);
  },

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string, clientId: string): Promise<void> {
    // Verify ownership
    const existing = await prisma.savedSearch.findUnique({
      where: { id: searchId },
    });

    if (!existing) {
      throw new AppError(404, 'Saved search not found');
    }

    if (existing.clientId !== clientId) {
      throw new AppError(403, 'Not authorized to delete this saved search');
    }

    await prisma.savedSearch.delete({
      where: { id: searchId },
    });
  },

  /**
   * Format saved search for API response
   */
  formatSavedSearch(search: {
    id: string;
    clientId: string;
    searchName: string | null;
    categoryId: string | null;
    locationCity: string | null;
    locationState: string | null;
    maxDistanceMiles: number | null;
    priceMin: any;
    priceMax: any;
    notifyNewMatches: boolean;
    createdAt: Date;
  }): SavedSearch {
    return {
      id: search.id,
      clientId: search.clientId,
      searchName: search.searchName,
      categoryId: search.categoryId,
      locationCity: search.locationCity,
      locationState: search.locationState,
      maxDistanceMiles: search.maxDistanceMiles,
      priceMin: search.priceMin ? Number(search.priceMin) : null,
      priceMax: search.priceMax ? Number(search.priceMax) : null,
      notifyNewMatches: search.notifyNewMatches,
      createdAt: search.createdAt.toISOString(),
    };
  },
};
