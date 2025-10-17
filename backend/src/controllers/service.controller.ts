import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { serviceService } from '../services/service.service';
import type {
  CreateServiceRequest,
  CreateServiceResponse,
  GetServiceResponse,
  GetServicesResponse,
  SaveServiceMediaRequest,
  SaveServiceMediaResponse,
  GenerateServiceDescriptionRequest,
  GenerateServiceDescriptionResponse,
} from '../../../shared-types';

/**
 * Create a new service
 */
export async function createService(
  req: Request<{}, {}, CreateServiceRequest>,
  res: Response<CreateServiceResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const {
      title,
      description,
      category,
      subcategory,
      priceMin,
      priceMax,
      priceType,
      durationMinutes,
      depositType,
      depositAmount,
      addons,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !priceMin ||
      !durationMinutes ||
      !depositType ||
      !depositAmount
    ) {
      throw new AppError(400, 'Missing required service fields');
    }

    const service = await serviceService.createService(userId, {
      title,
      description,
      category,
      subcategory,
      priceMin,
      priceMax,
      priceType,
      durationMinutes,
      depositType,
      depositAmount,
      addons,
    });

    sendSuccess<CreateServiceResponse>(
      res,
      {
        message: 'Service created successfully',
        service: service as any, // Type assertion for Prisma result
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, 'Provider profile not found'));
    }
    next(error);
  }
}

/**
 * Save service media URLs (files uploaded via /upload endpoint)
 */
export async function saveServiceMedia(
  req: Request<{ serviceId: string }, {}, SaveServiceMediaRequest>,
  res: Response<SaveServiceMediaResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { serviceId } = req.params;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!serviceId) {
      throw new AppError(400, 'Service ID required');
    }

    const { mediaUrls } = req.body;

    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      throw new AppError(400, 'Media URLs required');
    }

    // Save media URLs to database
    await serviceService.uploadServiceMedia(userId, serviceId, mediaUrls);

    sendSuccess<SaveServiceMediaResponse>(res, {
      message: 'Service media saved successfully',
      count: mediaUrls.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found or access denied')) {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Generate AI service description
 */
export async function generateServiceDescription(
  req: Request<{}, {}, GenerateServiceDescriptionRequest>,
  res: Response<GenerateServiceDescriptionResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { title, category, businessName } = req.body;

    if (!title || !category) {
      throw new AppError(400, 'Title and category required');
    }

    const description = await serviceService.generateServiceDescription(
      title,
      category,
      businessName
    );

    sendSuccess<GenerateServiceDescriptionResponse>(res, {
      message: 'Description generated successfully',
      description,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all services for a provider
 */
export async function getProviderServices(
  req: Request,
  res: Response<GetServicesResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const services = await serviceService.getProviderServices(userId);

    sendSuccess<GetServicesResponse>(res, {
      message: 'Services retrieved successfully',
      services: services as any, // Type assertion for Prisma result
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, 'Provider profile not found'));
    }
    next(error);
  }
}

/**
 * Get service by ID
 */
export async function getServiceById(
  req: Request<{ serviceId: string }>,
  res: Response<GetServiceResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      throw new AppError(400, 'Service ID required');
    }

    const service = await serviceService.getServiceById(serviceId);

    sendSuccess<GetServiceResponse>(res, {
      message: 'Service retrieved successfully',
      service: service as any, // Type assertion for Prisma result
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Service not found') {
      return next(new AppError(404, 'Service not found'));
    }
    next(error);
  }
}
