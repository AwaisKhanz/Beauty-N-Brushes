import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { serviceDraftService } from '../services/serviceDraft.service';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type { SaveDraftRequest, SaveDraftResponse, GetDraftResponse } from '../../../shared-types';
import { z } from 'zod';

export async function saveDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    // Get provider profile ID for the user
    const provider = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new AppError(404, 'Provider profile not found');
    }

    const schema = z.object({
      draftData: z.object({}).passthrough(), // Accept any structure for draft data
      currentStep: z.number().int().min(1).max(8),
    });

    const data = schema.parse(req.body) as SaveDraftRequest;
    const draft = await serviceDraftService.save(provider.id, data);

    sendSuccess<SaveDraftResponse>(res, {
      message: 'Draft saved',
      draft,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

export async function getDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    // Get provider profile ID for the user
    const provider = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new AppError(404, 'Provider profile not found');
    }

    const draft = await serviceDraftService.get(provider.id);

    sendSuccess<GetDraftResponse>(res, {
      draft,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    // Get provider profile ID for the user
    const provider = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new AppError(404, 'Provider profile not found');
    }

    await serviceDraftService.delete(provider.id);

    sendSuccess(res, { message: 'Draft deleted' });
  } catch (error) {
    next(error);
  }
}
