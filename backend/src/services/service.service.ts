import { prisma } from '../config/database';
import { aiService } from '../lib/ai';
import type { CreateServiceData, UploadResult } from '../types/service.types';

export class ServiceService {
  /**
   * Create a new service
   */
  async createService(userId: string, data: CreateServiceData) {
    // Find provider profile
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Find or create category
    let category = await prisma.serviceCategory.findFirst({
      where: { slug: data.category },
    });

    if (!category) {
      // Create category if it doesn't exist
      category = await prisma.serviceCategory.create({
        data: {
          name: data.category,
          slug: data.category,
        },
      });
    }

    // Create service using transaction
    const service = await prisma.$transaction(async (tx) => {
      // Create service
      const newService = await tx.service.create({
        data: {
          providerId: profile.id,
          categoryId: category.id,
          title: data.title,
          description: data.description,
          priceType: data.priceType,
          priceMin: data.priceMin,
          priceMax: data.priceMax,
          currency: profile.currency,
          depositRequired: true, // Always required
          depositType: data.depositType,
          depositAmount: data.depositAmount,
          durationMinutes: data.durationMinutes,
          active: true,
        },
      });

      // Create add-ons if provided
      if (data.addons && data.addons.length > 0) {
        await tx.serviceAddon.createMany({
          data: data.addons.map((addon, index) => ({
            serviceId: newService.id,
            addonName: addon.name,
            addonDescription: addon.description,
            addonPrice: addon.price,
            addonDurationMinutes: addon.duration,
            displayOrder: index,
          })),
        });
      }

      return newService;
    });

    return service;
  }

  /**
   * Upload service media
   */
  async uploadServiceMedia(userId: string, serviceId: string, fileUrls: UploadResult[]) {
    // Verify service belongs to user
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        provider: {
          userId,
        },
      },
    });

    if (!service) {
      throw new Error('Service not found or access denied');
    }

    // Create media records
    const mediaRecords = await prisma.serviceMedia.createMany({
      data: fileUrls.map((file, index) => ({
        serviceId,
        mediaType: 'image',
        fileUrl: file.url,
        thumbnailUrl: file.thumbnailUrl || file.url,
        displayOrder: index,
        processingStatus: 'completed',
        moderationStatus: 'pending',
      })),
    });

    return mediaRecords;
  }

  /**
   * Generate service description using AI
   */
  async generateServiceDescription(title: string, category: string, businessName?: string) {
    return aiService.generateServiceDescription(title, category, businessName);
  }

  /**
   * Get all services for a provider
   */
  async getProviderServices(userId: string) {
    // Find provider profile
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Get all services with related data
    const services = await prisma.service.findMany({
      where: {
        providerId: profile.id,
      },
      include: {
        category: true,
        addons: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        media: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return services;
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            slug: true,
            regionCode: true,
            currency: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        category: true,
        addons: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        media: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }
}

export const serviceService = new ServiceService();
