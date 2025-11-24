import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { clientManagementService } from '../services/client-management.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type {
  GetClientsResponse,
  GetClientDetailResponse,
  CreateClientNoteResponse,
  UpdateClientNoteResponse,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Get all clients for provider
 */
export async function getClients(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const sortBy =
      (req.query.sortBy as 'name' | 'bookings' | 'lastBooking' | 'totalSpent') || 'lastBooking';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await clientManagementService.getClients(
      userId,
      page,
      limit,
      search,
      sortBy,
      sortOrder
    );

    sendSuccess<GetClientsResponse>(res, {
      message: 'Clients retrieved successfully',
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get client detail
 */
export async function getClientDetail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { clientId } = req.params;

    if (!clientId) {
      throw new AppError(400, 'Client ID required');
    }

    const client = await clientManagementService.getClientDetail(userId, clientId);

    sendSuccess<GetClientDetailResponse>(res, {
      message: 'Client detail retrieved successfully',
      client,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message === 'Client not found') {
        return next(new AppError(404, error.message));
      }
    }
    next(error);
  }
}

/**
 * Create client note
 */
export async function createNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      clientId: z.string().uuid(),
      note: z.string().min(1).max(1000),
    });

    const data = schema.parse(req.body);

    const note = await clientManagementService.createNote(userId, data.clientId, data.note);

    sendSuccess<CreateClientNoteResponse>(
      res,
      {
        message: 'Note created successfully',
        note,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message.includes('Client not found')) {
        return next(new AppError(404, error.message));
      }
    }
    next(error);
  }
}

/**
 * Update client note
 */
export async function updateNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { noteId } = req.params;

    if (!noteId) {
      throw new AppError(400, 'Note ID required');
    }

    const schema = z.object({
      note: z.string().min(1).max(1000),
    });

    const data = schema.parse(req.body);

    const note = await clientManagementService.updateNote(userId, noteId, data.note);

    sendSuccess<UpdateClientNoteResponse>(res, {
      message: 'Note updated successfully',
      note,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message.includes('Note not found')) {
        return next(new AppError(404, error.message));
      }
    }
    next(error);
  }
}

/**
 * Delete client note
 */
export async function deleteNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { noteId } = req.params;

    if (!noteId) {
      throw new AppError(400, 'Note ID required');
    }

    await clientManagementService.deleteNote(userId, noteId);

    sendSuccess(res, {
      message: 'Note deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message.includes('Note not found')) {
        return next(new AppError(404, error.message));
      }
    }
    next(error);
  }
}
