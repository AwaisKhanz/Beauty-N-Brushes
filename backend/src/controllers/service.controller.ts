import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { serviceService } from '../services/service.service';
import type { AuthRequest } from '../types';
import type {
  CreateServiceRequest,
  CreateServiceResponse,
  GetServiceResponse,
  GetServicesResponse,
  SaveServiceMediaRequest,
  SaveServiceMediaResponse,
  GenerateServiceDescriptionRequest,
  GenerateServiceDescriptionResponse,
  GenerateHashtagsRequest,
  GenerateHashtagsResponse,
  AnalyzeImageRequest,
  AnalyzeImageResponse,
  Service,
  GetDraftServicesResponse,
} from '../../../shared-types';
import { z } from 'zod';

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

    const schema = z.object({
      title: z.string().min(3, 'Title must be at least 3 characters').max(255),
      description: z.string().min(20, 'Description must be at least 20 characters'),
      category: z.string().min(1, 'Category is required'),
      subcategory: z.string().optional(),
      priceMin: z.coerce.number().positive('Price must be positive'),
      priceMax: z.coerce.number().positive().optional(),
      priceType: z.enum(['fixed', 'range', 'starting_at']),
      durationMinutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
      depositType: z.enum(['PERCENTAGE', 'FLAT']),
      depositAmount: z.coerce.number().positive('Deposit amount must be positive'),
      // Mobile/Home service configuration
      mobileServiceAvailable: z.boolean().optional(),
      homeServiceFee: z.coerce.number().min(0).optional(),
      addons: z
        .array(
          z.object({
            name: z.string().min(2),
            description: z.string().optional(),
            price: z.coerce.number().positive(),
            duration: z.coerce.number().min(0),
          })
        )
        .optional(),
      createdFromTemplate: z.boolean().optional(),
      templateId: z.string().optional(),
      templateName: z.string().optional(),
    });

    const data = schema.parse(req.body) as CreateServiceRequest;

    const service = await serviceService.createService(userId, data);

    sendSuccess<CreateServiceResponse>(
      res,
      {
        message: 'Service created successfully',
        service: service as unknown as CreateServiceResponse['service'],
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
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

    const schema = z.object({
      mediaUrls: z
        .array(
          z.object({
            url: z.string().url(),
            thumbnailUrl: z.string().url().optional(),
            mediumUrl: z.string().url().optional(),
            largeUrl: z.string().url().optional(),
            mediaType: z.enum(['image', 'video']).optional(),
            caption: z.string().optional(),
            displayOrder: z.number().optional(),
            isFeatured: z.boolean().optional(),
          })
        )
        .min(1, 'At least one media URL is required'),
    });

    const data = schema.parse(req.body) as SaveServiceMediaRequest;

    // Save media URLs to database
    await serviceService.uploadServiceMedia(userId, serviceId, data.mediaUrls);

    sendSuccess<SaveServiceMediaResponse>(res, {
      message: 'Service media saved successfully',
      count: data.mediaUrls.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
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
    const schema = z.object({
      title: z.string().min(1, 'Title is required'),
      category: z.string().min(1, 'Category is required'),
      subcategory: z.string().optional(),
      businessName: z.string().optional(),
      tone: z.enum(['professional', 'friendly', 'luxury', 'casual', 'energetic']).optional(),
      includeHashtags: z.boolean().optional(),
      includeKeywords: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as GenerateServiceDescriptionRequest;

    const result = await serviceService.generateEnhancedServiceDescription({
      title: data.title,
      category: data.category,
      subcategory: data.subcategory,
      businessName: data.businessName,
      tone: data.tone || 'professional',
      includeHashtags: data.includeHashtags || false,
      includeKeywords: data.includeKeywords || false,
    });

    sendSuccess<GenerateServiceDescriptionResponse>(res, {
      message: 'Description generated successfully',
      description: result.description,
      hashtags: result.hashtags,
      keywords: result.keywords,
      estimatedDuration: result.estimatedDuration,
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

/**
 * Generate additional hashtags
 */
export async function generateHashtags(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schema = z.object({
      title: z.string().min(1, 'Title is required'),
      category: z.string().min(1, 'Category is required'),
      subcategory: z.string().optional(),
      existingHashtags: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body) as GenerateHashtagsRequest;

    const hashtags = await serviceService.generateHashtags({
      title: data.title,
      category: data.category,
      subcategory: data.subcategory,
      existingHashtags: data.existingHashtags || [],
    });

    sendSuccess<GenerateHashtagsResponse>(res, {
      message: 'Hashtags generated successfully',
      hashtags,
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

/**
 * Analyze image with AI for tagging
 */
export async function analyzeImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schema = z.object({
      imageUrl: z.string().url('Valid image URL is required'),
    });

    const data = schema.parse(req.body) as AnalyzeImageRequest;

    console.log('Analyzing image URL:', data.imageUrl);

    // Fetch the image and convert to base64
    const imageResponse = await fetch(data.imageUrl);
    if (!imageResponse.ok) {
      throw new AppError(400, 'Failed to fetch image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Use AI service directly to analyze image
    const aiService = require('../lib/ai').default;
    const analysis = await aiService.analyzeImageFromBase64(base64Image);

    sendSuccess<AnalyzeImageResponse>(res, {
      message: 'Image analyzed successfully',
      data: {
        tags: analysis.tags,
      },
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
      country,
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

    const result = await serviceService.searchServicesWithFallback(
      {
        query: query as string,
        category: category as string,
        subcategory: subcategory as string,
        city: city as string,
        state: state as string,
        country: country as string,
        latitude: latitude ? parseFloat(latitude as string) : undefined,
        longitude: longitude ? parseFloat(longitude as string) : undefined,
        radius: radius ? parseFloat(radius as string) : undefined,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        rating: rating ? parseFloat(rating as string) : undefined,
        mobileService: mobileService === 'true' ? true : mobileService === 'false' ? false : undefined,
        isSalon: isSalon === 'true' ? true : isSalon === 'false' ? false : undefined,
        availability: availability as string,
      },
      parseInt(page as string),
      parseInt(limit as string),
      {
        field: validatedSortField,
        order: sortOrder as 'asc' | 'desc',
      }
    );

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
