import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { serviceService } from '../services/service.service';
import type { AuthRequest } from '../types';
import type {
  CreateServiceResponse,
  GetServiceResponse,
  GetServicesResponse,
  SaveServiceMediaResponse,
  GenerateServiceDescriptionResponse,
  Service,
  GetDraftServicesResponse,
} from '../../../shared-types';

/**
 * Create a new service
 */
export async function createService(
  req: AuthRequest,
  res: Response<CreateServiceResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

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
        service: service as unknown as CreateServiceResponse['service'],
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
  req: AuthRequest,
  res: Response<SaveServiceMediaResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
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
 * Generate AI service description with enhanced features
 */
export async function generateServiceDescription(
  req: AuthRequest,
  res: Response<GenerateServiceDescriptionResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { title, category, subcategory, businessName, tone, includeHashtags, includeKeywords } =
      req.body;

    if (!title || !category) {
      throw new AppError(400, 'Title and category required');
    }

    const result = await serviceService.generateEnhancedServiceDescription({
      title,
      category,
      subcategory,
      businessName,
      tone: tone || 'professional',
      includeHashtags: includeHashtags || false,
      includeKeywords: includeKeywords || false,
    });

    sendSuccess<GenerateServiceDescriptionResponse>(res, {
      message: 'Description generated successfully',
      description: result.description,
      hashtags: result.hashtags,
      keywords: result.keywords,
      estimatedDuration: result.estimatedDuration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate additional hashtags
 */
export async function generateHashtags(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, category, subcategory, existingHashtags } = req.body;

    if (!title || !category) {
      throw new AppError(400, 'Title and category required');
    }

    const hashtags = await serviceService.generateHashtags({
      title,
      category,
      subcategory,
      existingHashtags: existingHashtags || [],
    });

    sendSuccess(res, {
      message: 'Hashtags generated successfully',
      hashtags,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Analyze image with AI for tagging
 */
export async function analyzeImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log('AI analyze-image request body:', req.body);
    const { imageUrl } = req.body;

    if (!imageUrl) {
      console.log('Missing imageUrl in request body');
      throw new AppError(400, 'Image URL required');
    }

    console.log('Analyzing image URL:', imageUrl);

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new AppError(400, 'Failed to fetch image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Use AI service directly to analyze image
    const aiService = require('../lib/ai').default;
    const analysis = await aiService.analyzeImageFromBase64(base64Image);

    sendSuccess(res, {
      message: 'Image analyzed successfully',
      data: {
        tags: analysis.tags,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all services for a provider
 */
export async function getProviderServices(
  req: AuthRequest,
  res: Response<GetServicesResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const services = await serviceService.getProviderServices(userId);

    sendSuccess<GetServicesResponse>(res, {
      message: 'Services retrieved successfully',
      services: services as unknown as GetServicesResponse['services'],
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
  req: AuthRequest,
  res: Response<GetServiceResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      throw new AppError(400, 'Service ID required');
    }

    const service = await serviceService.getServiceById(serviceId);

    // Note: Using double cast because Prisma's Decimal type is incompatible with TypeScript's number
    // This is safe at runtime as Decimal correctly serializes to number in JSON responses
    sendSuccess<GetServiceResponse>(res, {
      message: 'Service retrieved successfully',
      service: service as unknown as Service,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Service not found') {
      return next(new AppError(404, 'Service not found'));
    }
    next(error);
  }
}

/**
 * Update service
 */
export async function updateService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!serviceId) {
      throw new AppError(400, 'Service ID required');
    }

    const service = await serviceService.updateService(userId, serviceId, req.body);

    sendSuccess(res, {
      message: 'Service updated successfully',
      service: service as unknown as Service,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Service not found or access denied') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get draft services for provider
 */
export async function getDraftServices(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const result = await serviceService.getDraftServices(userId);

    sendSuccess<GetDraftServicesResponse>(res, {
      drafts: result.drafts,
      total: result.total,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * PUBLIC: Search services with comprehensive filters
 */
export async function searchServices(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      query,
      category,
      subcategory,
      city,
      state,
      latitude,
      longitude,
      radius,
      priceMin,
      priceMax,
      rating,
      mobileService,
      isSalon,
      availability,
      sortField = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const validSortFields = ['relevance', 'price', 'rating', 'distance', 'createdAt'] as const;
    type ValidSortField = (typeof validSortFields)[number];

    const sortFieldValue = (sortField as string) || 'relevance';
    const validatedSortField: ValidSortField = validSortFields.includes(
      sortFieldValue as ValidSortField
    )
      ? (sortFieldValue as ValidSortField)
      : 'relevance';

    const result = await serviceService.searchServices({
      filters: {
        query: query as string,
        category: category as string,
        subcategory: subcategory as string,
        city: city as string,
        state: state as string,
        latitude: latitude ? parseFloat(latitude as string) : undefined,
        longitude: longitude ? parseFloat(longitude as string) : undefined,
        radius: radius ? parseFloat(radius as string) : undefined,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        rating: rating ? parseFloat(rating as string) : undefined,
        mobileService: mobileService === 'true',
        isSalon: isSalon === 'true' ? true : isSalon === 'false' ? false : undefined,
        availability: availability as string,
      },
      sort: {
        field: validatedSortField,
        order: sortOrder as 'asc' | 'desc',
      },
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * PUBLIC: Get featured services
 */
export async function getFeaturedServices(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { limit = 12 } = req.query;

    const result = await serviceService.getFeaturedServices(parseInt(limit as string));

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * PUBLIC: Get all categories with service counts
 */
export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await serviceService.getCategories();

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * PUBLIC: Get related services for a service
 */
export async function getRelatedServices(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { serviceId } = req.params;
    if (!serviceId) throw new AppError(400, 'Service ID required');

    const relatedServices = await serviceService.getRelatedServices(serviceId);

    sendSuccess(res, {
      message: 'Related services retrieved',
      services: relatedServices,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Service not found') {
      return next(new AppError(404, 'Service not found'));
    }
    next(error);
  }
}

/**
 * PUBLIC: Get service reviews
 */
export async function getServiceReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { serviceId } = req.params;
    if (!serviceId) throw new AppError(400, 'Service ID required');

    const reviews = await serviceService.getServiceReviews(serviceId);

    sendSuccess(res, {
      message: 'Service reviews retrieved',
      reviews,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Service not found') {
      return next(new AppError(404, 'Service not found'));
    }
    next(error);
  }
}
