import { prisma } from '../config/database';
import { aiService } from '../lib/ai';
import { mediaProcessorService } from './media-processor.service';
import { notificationService } from './notification.service';
import { emitServiceUpdate } from '../config/socket.server';
import type { CreateServiceData } from '../types/service.types';
import type { SaveServiceMediaRequest, ServiceSearchFilters, ServiceSearchSort } from '../../../shared-types';
import { Prisma } from '@prisma/client';

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

    // Find or create subcategory if provided
    let subcategoryId: string | null = null;
    if (data.subcategory) {
      let subcategory = await prisma.serviceSubcategory.findFirst({
        where: {
          slug: data.subcategory,
          categoryId: category.id,
        },
      });

      if (!subcategory) {
        subcategory = await prisma.serviceSubcategory.create({
          data: {
            categoryId: category.id,
            name: data.subcategory,
            slug: data.subcategory,
          },
        });
      }

      subcategoryId = subcategory.id;
    }

    // Create service using transaction
    const service = await prisma.$transaction(async (tx) => {
      // Create service
      const newService = await tx.service.create({
        data: {
          providerId: profile.id,
          categoryId: category.id,
          subcategoryId,
          title: data.title,
          description: data.description,
          priceType: data.priceType,
          priceMin: data.priceMin,
          priceMax: data.priceMax,
          currency: profile.currency,
          // Deposits are ALWAYS mandatory per requirements
          depositType: data.depositType,
          depositAmount: data.depositAmount,
          // Mobile/Home service configuration
          mobileServiceAvailable: data.mobileServiceAvailable || false,
          homeServiceFee: data.homeServiceFee || null,
          durationMinutes: data.durationMinutes,
          active: true,
          // Template tracking
          createdFromTemplate: data.createdFromTemplate || false,
          templateId: data.templateId,
          templateName: data.templateName,
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

    // Send notification for newly published service
    try {
      await notificationService.createServicePublishedNotification(
        userId,
        service.title,
        service.id
      );

      emitServiceUpdate(userId, {
        type: 'service_published',
        service: {
          id: service.id,
          title: service.title,
        },
      });
    } catch (err) {
      console.error('Failed to send service published notification:', err);
    }

    return service;
  }

  /**
   * Upload service media with AI auto-tagging
   */
  async uploadServiceMedia(
    userId: string,
    serviceId: string,
    mediaData: SaveServiceMediaRequest['mediaUrls']
  ) {
    // Verify service belongs to user and get service details
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        provider: {
          userId,
        },
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    if (!service) {
      throw new Error('Service not found or access denied');
    }

    // Build text context for multimodal embeddings
    const serviceContext = [
      service.title,
      service.description?.substring(0, 150),
      service.category.name,
      service.subcategory?.name,
    ]
      .filter(Boolean)
      .join(' - ')
      .substring(0, 200);

    // Fetch existing media to check which images already have embeddings
    const existingMedia = await prisma.$queryRaw<
      Array<{
        fileUrl: string;
        aiTags: string[];
        aiEmbedding: string;
        mediaType: string;
      }>
    >`
      SELECT 
        "fileUrl",
        "aiTags",
        "aiEmbedding"::text as "aiEmbedding",
        "mediaType"
      FROM "ServiceMedia"
      WHERE "serviceId"::text = ${serviceId}
    `;

    // Create map for quick lookups
    const existingMediaMap = new Map(
      existingMedia.map((m) => [
        m.fileUrl,
        {
          aiTags: m.aiTags,
          aiEmbedding: m.aiEmbedding,
          mediaType: m.mediaType,
        },
      ])
    );

    // Delete existing media (will recreate)
    await prisma.serviceMedia.deleteMany({
      where: { serviceId },
    });

    // Separate media into reused vs new
    const mediaToQueue: Array<{ mediaId: string; mediaUrl: string }> = [];

    console.log(`\n📊 Media Upload Summary:`);
    console.log(`   Total: ${mediaData.length} media file(s)`);

    // Save all media records IMMEDIATELY
    for (let i = 0; i < mediaData.length; i++) {
      const media = mediaData[i];
      const existing = existingMediaMap.get(media.url);

      if (existing && existing.aiEmbedding && existing.aiTags.length > 0) {
        // REUSED MEDIA: Save with existing analysis (status: completed)
        await prisma.$executeRaw`
          INSERT INTO "ServiceMedia" (
            "id",
            "serviceId",
            "mediaType",
            "fileUrl",
            "thumbnailUrl",
            "urlMedium",
            "urlLarge",
            "caption",
            "isFeatured",
            "displayOrder",
            "aiTags",
            "aiEmbedding",
            "processingStatus",
            "moderationStatus",
            "createdAt",
            "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            ${serviceId}::uuid,
            ${media.mediaType}::text,
            ${media.url}::text,
            ${media.thumbnailUrl || media.url}::text,
            ${media.mediumUrl || null}::text,
            ${media.largeUrl || null}::text,
            ${media.caption || null}::text,
            ${media.isFeatured || false}::boolean,
            ${i}::integer,
            ${existing.aiTags}::text[],
            ${existing.aiEmbedding}::vector,
            'completed'::text,
            'pending'::text,
            NOW(),
            NOW()
          )
        `;
      } else {
        // NEW MEDIA: Save with pending status, will be processed in background
        const emptyEmbedding = new Array(512).fill(0);
        const embeddingStr = `[${emptyEmbedding.join(',')}]`;

        const result = await prisma.$queryRaw<Array<{ id: string }>>`
          INSERT INTO "ServiceMedia" (
            "id",
            "serviceId",
            "mediaType",
            "fileUrl",
            "thumbnailUrl",
            "urlMedium",
            "urlLarge",
            "caption",
            "isFeatured",
            "displayOrder",
            "aiTags",
            "aiEmbedding",
            "processingStatus",
            "moderationStatus",
            "createdAt",
            "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            ${serviceId}::uuid,
            ${media.mediaType}::text,
            ${media.url}::text,
            ${media.thumbnailUrl || media.url}::text,
            ${media.mediumUrl || null}::text,
            ${media.largeUrl || null}::text,
            ${media.caption || null}::text,
            ${media.isFeatured || false}::boolean,
            ${i}::integer,
            ARRAY[]::text[],
            ${embeddingStr}::vector,
            ${media.mediaType === 'image' ? 'pending' : 'n/a'}::text,
            'pending'::text,
            NOW(),
            NOW()
          )
          RETURNING "id"
        `;

        // Queue for background processing (images only)
        if (media.mediaType === 'image' && result[0]) {
          mediaToQueue.push({ mediaId: result[0].id, mediaUrl: media.url });
        }
      }
    }

    // Enqueue new media for background AI processing (NON-BLOCKING)
    if (mediaToQueue.length > 0) {
      console.log(`🚀 Queuing ${mediaToQueue.length} image(s) for background AI processing`);

      // Fire and forget - don't wait for processing
      mediaProcessorService
        .enqueueBatch(serviceId, mediaToQueue, service.category.name, serviceContext)
        .catch((error) => {
          console.error('Failed to enqueue media for processing:', error);
        });
    }

    console.log(`✅ Uploaded ${mediaData.length} media file(s) successfully`);

    return {
      count: mediaData.length,
      message: `Uploaded ${mediaData.length} media file(s). ${mediaToQueue.length > 0 ? `${mediaToQueue.length} image(s) are being analyzed in the background.` : 'All images already analyzed.'}`,
    };
  }

  /**
   * Generate service description using AI
   */
  async generateServiceDescription(title: string, category: string, businessName?: string) {
    return aiService.generateServiceDescription(title, category, businessName);
  }

  /**
   * Generate enhanced service description with AI
   */
  async generateEnhancedServiceDescription(params: {
    title: string;
    category: string;
    subcategory?: string;
    businessName?: string;
    tone?: 'professional' | 'friendly' | 'luxury' | 'casual' | 'energetic';
    includeHashtags?: boolean;
    includeKeywords?: boolean;
  }) {
    const {
      title,
      category,
      subcategory,
      businessName,
      tone = 'professional',
      includeHashtags = false,
      includeKeywords = false,
    } = params;

    // Create enhanced prompt for AI
    const prompt = `Generate a compelling ${tone} service description (less then 800 words) for a beauty/wellness service:

Service: ${title}
Category: ${category}${subcategory ? ` > ${subcategory}` : ''}
${businessName ? `Business: ${businessName}` : ''}

Requirements:
- Tone: ${tone}
- Length: 100-300 words
- Focus on benefits and experience
- Include what makes this service special
${includeHashtags ? '- Include relevant hashtags' : ''}
${includeKeywords ? '- Include SEO keywords' : ''}

Format the response as JSON with:
{
  "description": "main description text",
  ${includeHashtags ? '"hashtags": ["array", "of", "hashtags"],' : ''}
  ${includeKeywords ? '"keywords": ["array", "of", "keywords"],' : ''}
  "estimatedDuration": number_in_minutes
}`;

    try {
      const response = await aiService.generateText(prompt);

      // Remove markdown code blocks if present (```json ... ```)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```')) {
        // Remove opening ```json or ```
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '');
        // Remove closing ```
        cleanedResponse = cleanedResponse.replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleanedResponse);

      return {
        description: parsed.description || '',
        hashtags: parsed.hashtags || [],
        keywords: parsed.keywords || [],
        estimatedDuration: parsed.estimatedDuration || 60,
      };
    } catch (error) {
      console.error('Error generating enhanced description:', error);
      // Fallback to basic description
      const basicDescription = await aiService.generateServiceDescription(
        title,
        category,
        businessName
      );
      return {
        description: basicDescription,
        hashtags: includeHashtags
          ? [`#${category.toLowerCase()}`, `#${title.toLowerCase().replace(/\s+/g, '')}`]
          : [],
        keywords: includeKeywords ? [category, title] : [],
        estimatedDuration: 60,
      };
    }
  }

  /**
   * Generate hashtags for a service
   */
  async generateHashtags(params: {
    title: string;
    category: string;
    subcategory?: string;
    existingHashtags?: string[];
  }) {
    const { title, category, subcategory, existingHashtags = [] } = params;

    const prompt = `Generate 8-12 relevant hashtags for a beauty/wellness service:

Service: ${title}
Category: ${category}${subcategory ? ` > ${subcategory}` : ''}
${existingHashtags.length ? `Existing hashtags: ${existingHashtags.join(', ')}` : ''}

Requirements:
- Include trending beauty/wellness hashtags
- Mix of popular and niche hashtags
- No spaces, use camelCase for multi-word hashtags
- Avoid duplicating existing hashtags
- Include local/regional tags when relevant

Return as JSON array: ["hashtag1", "hashtag2", ...]`;

    try {
      const response = await aiService.generateText(prompt);
      const hashtags = JSON.parse(response);

      // Filter out existing hashtags and ensure they start with #
      const newHashtags = hashtags
        .map((tag: string) => (tag.startsWith('#') ? tag : `#${tag}`))
        .filter((tag: string) => !existingHashtags.includes(tag));

      return newHashtags.slice(0, 12); // Limit to 12 hashtags
    } catch (error) {
      console.error('Error generating hashtags:', error);
      // Fallback hashtags
      return [
        `#${category.toLowerCase()}`,
        `#${title.toLowerCase().replace(/\s+/g, '')}`,
        '#beauty',
        '#wellness',
        '#selfcare',
        '#bookingsopen',
      ].filter((tag) => !existingHashtags.includes(tag));
    }
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
            instantBookingEnabled: true,
            advanceBookingDays: true,
            isSalon: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        category: true,
        subcategory: true,
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

  /**
   * Update service
   */
  async updateService(userId: string, serviceId: string, data: Partial<CreateServiceData>) {
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

    // Handle category/subcategory updates
    let categoryId = service.categoryId;
    let subcategoryId = service.subcategoryId;

    if (data.category) {
      let category = await prisma.serviceCategory.findFirst({
        where: { slug: data.category },
      });

      if (!category) {
        category = await prisma.serviceCategory.create({
          data: {
            name: data.category,
            slug: data.category,
          },
        });
      }
      categoryId = category.id;

      // Handle subcategory
      if (data.subcategory) {
        let subcategory = await prisma.serviceSubcategory.findFirst({
          where: {
            slug: data.subcategory,
            categoryId: category.id,
          },
        });

        if (!subcategory) {
          subcategory = await prisma.serviceSubcategory.create({
            data: {
              categoryId: category.id,
              name: data.subcategory,
              slug: data.subcategory,
            },
          });
        }
        subcategoryId = subcategory.id;
      } else {
        subcategoryId = null;
      }
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        title: data.title,
        description: data.description,
        categoryId,
        subcategoryId,
        priceType: data.priceType,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        durationMinutes: data.durationMinutes,
        depositType: data.depositType,
        depositAmount: data.depositAmount,
        // Preserve template tracking (if provided in update)
        ...(data.createdFromTemplate !== undefined && {
          createdFromTemplate: data.createdFromTemplate,
          templateId: data.templateId,
          templateName: data.templateName,
        }),
      },
    });

    // Update add-ons if provided
    if (data.addons) {
      // Delete existing add-ons
      await prisma.serviceAddon.deleteMany({
        where: { serviceId },
      });

      // Create new add-ons
      if (data.addons.length > 0) {
        await prisma.serviceAddon.createMany({
          data: data.addons.map((addon, index) => ({
            serviceId,
            addonName: addon.name,
            addonDescription: addon.description,
            addonPrice: addon.price,
            addonDurationMinutes: addon.duration,
            displayOrder: index,
          })),
        });
      }
    }

    return updatedService;
  }

  /**
   * Get draft services by provider
   */
  async getDraftServices(userId: string) {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new Error('Provider profile not found');
    }

    const drafts = await prisma.serviceDraft.findMany({
      where: {
        providerId: provider.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Convert drafts to DraftService format
    const draftServices = drafts.map((draft) => {
      const draftData = draft.draftData as Record<string, unknown>;
      return {
        id: draft.id,
        title: (draftData.title as string) || 'Untitled Service',
        category: (draftData.category as string) || '',
        subcategory: (draftData.subcategory as string) || '',
        currentStep: draft.currentStep,
        lastSaved: draft.updatedAt.toISOString(),
        isDraft: true as const,
      };
    });

    return {
      drafts: draftServices,
      total: draftServices.length,
    };
  }

  /**
   * Public search services with comprehensive filters
   */
  async searchServices(params: {
    filters?: {
      query?: string;
      category?: string;
      subcategory?: string;
      city?: string;
      state?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
      priceMin?: number;
      priceMax?: number;
      rating?: number;
      mobileService?: boolean;
      isSalon?: boolean;
      availability?: string;
      country?: string;
    };
    sort?: {
      field: 'relevance' | 'price' | 'rating' | 'distance' | 'createdAt';
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }) {
    const {
      filters = {},
      sort = { field: 'relevance', order: 'desc' },
      page = 1,
      limit = 20,
    } = params;

    const skip = (page - 1) * limit;

    // Base query parts
    const conditions: Prisma.Sql[] = [];
    
    // Active services only
    conditions.push(Prisma.sql`s.active = true`);
    
    // Provider status checks
    conditions.push(Prisma.sql`p."profileCompleted" = true`);
    conditions.push(Prisma.sql`p."acceptsNewClients" = true`);
    conditions.push(Prisma.sql`p."profilePaused" = false`);
    conditions.push(Prisma.sql`p."verificationStatus" IN ('pending', 'approved', 'verified')`);
    // Check user status via join if needed, but ProviderProfile usually implies active user if it exists and is active.
    // For strictness, we could join User table, but let's assume ProviderProfile management handles this.

    // Text search
    if (filters.query) {
      const searchPattern = `%${filters.query}%`;
      conditions.push(Prisma.sql`(
        s.title ILIKE ${searchPattern} OR 
        s.description ILIKE ${searchPattern}
      )`);
    }

    // Category
    if (filters.category) {
      conditions.push(Prisma.sql`c.slug = ${filters.category}`);
    }

    // Subcategory
    if (filters.subcategory) {
      conditions.push(Prisma.sql`sc.slug = ${filters.subcategory}`);
    }

    // Location (City/State/Country)
    // When using geolocation (lat/lng), skip city/state text filters
    // and rely purely on distance-based filtering for accuracy
    // Only apply city/state filters for manual text-based searches
    if (!filters.latitude || !filters.longitude) {
      if (filters.city) {
        conditions.push(Prisma.sql`p.city ILIKE ${filters.city}`);
      }
      if (filters.state) {
        conditions.push(Prisma.sql`p.state ILIKE ${filters.state}`);
      }
    }
    
    // Always apply country filter if provided (for both geo and text searches)
    if (filters.country) {
      conditions.push(Prisma.sql`p.country ILIKE ${filters.country}`);
    }

    // Price
    if (filters.priceMin !== undefined) {
      conditions.push(Prisma.sql`s."priceMin" >= ${filters.priceMin}`);
    }
    if (filters.priceMax !== undefined) {
      conditions.push(Prisma.sql`s."priceMin" <= ${filters.priceMax}`);
    }

    // Rating
    if (filters.rating !== undefined) {
      conditions.push(Prisma.sql`p."averageRating" >= ${filters.rating}`);
    }

    // Mobile Service
    if (filters.mobileService !== undefined) {
      conditions.push(Prisma.sql`p."mobileServiceAvailable" = ${filters.mobileService}`);
    }

    // Salon vs Solo
    if (filters.isSalon !== undefined) {
      conditions.push(Prisma.sql`p."isSalon" = ${filters.isSalon}`);
    }

    // Distance Calculation & Filtering
    let distanceColumn = Prisma.sql`NULL::float`;
    
    if (filters.latitude && filters.longitude) {
      // Haversine formula (miles)
      // 3959 miles is earth radius
      distanceColumn = Prisma.sql`
        (3959 * acos(
          cos(radians(${filters.latitude})) * cos(radians(p.latitude::float)) *
          cos(radians(p.longitude::float) - radians(${filters.longitude})) +
          sin(radians(${filters.latitude})) * sin(radians(p.latitude::float))
        ))
      `;

      // Apply radius filter (default to 200 miles for international searches)
      const radiusLimit = filters.radius || 200;
      conditions.push(Prisma.sql`
        (3959 * acos(
          cos(radians(${filters.latitude})) * cos(radians(p.latitude::float)) *
          cos(radians(p.longitude::float) - radians(${filters.longitude})) +
          sin(radians(${filters.latitude})) * sin(radians(p.latitude::float))
        )) <= ${radiusLimit}
      `);
    }

    // Construct WHERE clause
    const whereClause = conditions.length > 0 
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` 
      : Prisma.empty;

    // Sorting
    let orderByClause = Prisma.sql`ORDER BY s."createdAt" DESC`;
    
    switch (sort.field) {
      case 'price':
        orderByClause = Prisma.sql`ORDER BY s."priceMin" ${Prisma.raw(sort.order.toUpperCase())}`;
        break;
      case 'rating':
        orderByClause = Prisma.sql`ORDER BY p."averageRating" ${Prisma.raw(sort.order.toUpperCase())}`;
        break;
      case 'createdAt':
        orderByClause = Prisma.sql`ORDER BY s."createdAt" ${Prisma.raw(sort.order.toUpperCase())}`;
        break;
      case 'distance':
        if (filters.latitude && filters.longitude) {
          orderByClause = Prisma.sql`ORDER BY distance ${Prisma.raw(sort.order.toUpperCase())}`;
        }
        break;
    }

    // Execute Query to get IDs and Distance
    const rawServices = await prisma.$queryRaw<Array<{ id: string; distance: number | null; total_count: bigint }>>`
      SELECT 
        s.id,
        ${distanceColumn} as distance,
        count(*) OVER() as total_count
      FROM "Service" s
      JOIN "ProviderProfile" p ON s."providerId" = p.id
      JOIN "ServiceCategory" c ON s."categoryId" = c.id
      LEFT JOIN "ServiceSubcategory" sc ON s."subcategoryId" = sc.id
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    const total = rawServices.length > 0 ? Number(rawServices[0].total_count) : 0;
    const serviceIds = rawServices.map(r => r.id);
    const distanceMap = new Map(rawServices.map(r => [r.id, r.distance]));

    // Fetch full service details
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      include: {
        category: true,
        subcategory: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logoUrl: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
            averageRating: true,
            totalReviews: true,
            isSalon: true,
          },
        },
        media: {
          where: { isFeatured: true },
          take: 1,
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // Merge distance and sort back to original order
    const sortedServices = serviceIds
      .map(id => services.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(service => ({
        ...service,
        distance: distanceMap.get(service.id) || undefined,
      }));

    // Map to PublicServiceResult
    const mappedServices = sortedServices.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description || '',
      priceMin: service.priceMin.toNumber(),
      priceMax: service.priceMax?.toNumber() || null,
      priceType: service.priceType,
      currency: service.currency,
      durationMinutes: service.durationMinutes,
      category: service.category.name,
      subcategory: service.subcategory?.name || null,
      featuredImageUrl: service.media[0]?.urlMedium || service.media[0]?.fileUrl || null,
      providerId: service.provider.id,
      providerName: service.provider.businessName,
      providerSlug: service.provider.slug,
      providerLogoUrl: service.provider.logoUrl,
      providerCity: service.provider.city,
      providerState: service.provider.state,
      providerRating: service.provider.averageRating.toNumber(),
      providerReviewCount: service.provider.totalReviews,
      providerIsSalon: service.provider.isSalon,
      distance: service.distance,
    }));

    return {
      services: mappedServices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      appliedFilters: filters,
    };
  }

  /**
   * Search services with intelligent fallback
   * Automatically expands radius if no results found
   */
  async searchServicesWithFallback(
    filters: ServiceSearchFilters,
    page: number = 1,
    limit: number = 12,
    sort?: ServiceSearchSort
  ) {
    // Try initial search
    let result = await this.searchServices({
      filters,
      sort,
      page,
      limit,
    });
    
    // If no results and we have location filters, try expanding radius
    if (result.total === 0 && filters.latitude && filters.longitude) {
      const originalRadius = filters.radius || 200;
      const expandedRadius = originalRadius + 50;
      
      // Retry with expanded radius
      const expandedFilters = { ...filters, radius: expandedRadius };
      const expandedResult = await this.searchServices({
        filters: expandedFilters,
        sort,
        page,
        limit,
      });
      
      // If we found results with expanded radius, return them with metadata
      if (expandedResult.total > 0) {
        return {
          ...expandedResult,
          radiusExpanded: true,
          originalRadius,
          expandedRadius,
        };
      }
    }
    
    // Return original result (either has results or no fallback needed)
    return {
      ...result,
      radiusExpanded: false,
    };
  }

  /**
   * Get featured/popular services
   */
  async getFeaturedServices(limit: number = 12) {
    const services = await prisma.service.findMany({
      where: {
        active: true,
        provider: {
          user: {
            status: 'ACTIVE',
          },
          // Allow pending and approved providers (Requirements: Line 95-98)
          verificationStatus: { in: ['pending', 'approved', 'verified'] },
          profileCompleted: true,
          acceptsNewClients: true,
          featured: true, // Featured providers
        },
      },
      include: {
        category: true,
        subcategory: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logoUrl: true,
            city: true,
            state: true,
            averageRating: true,
            totalReviews: true,
            isSalon: true,
          },
        },
        media: {
          where: { isFeatured: true },
          take: 1,
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ bookingCount: 'desc' }, { provider: { averageRating: 'desc' } }],
      take: limit,
    });

    return {
      services: services.map((service) => ({
        id: service.id,
        title: service.title,
        description: service.description,
        priceMin: service.priceMin.toNumber(),
        priceMax: service.priceMax?.toNumber() || null,
        priceType: service.priceType,
        currency: service.currency,
        durationMinutes: service.durationMinutes,
        category: service.category.name,
        subcategory: service.subcategory?.name || null,
        featuredImageUrl: service.media[0]?.fileUrl || null,
        providerId: service.provider.id,
        providerName: service.provider.businessName,
        providerSlug: service.provider.slug,
        providerLogoUrl: service.provider.logoUrl,
        providerCity: service.provider.city,
        providerState: service.provider.state,
        providerRating: service.provider.averageRating.toNumber(),
        providerReviewCount: service.provider.totalReviews,
        providerIsSalon: service.provider.isSalon,
      })),
      total: services.length,
    };
  }

  /**
   * Get all categories with service counts
   */
  async getCategories() {
    const categories = await prisma.serviceCategory.findMany({
      where: { active: true },
      include: {
        subcategories: {
          where: { active: true },
          include: {
            _count: {
              select: {
                services: {
                  where: {
                    active: true,
                    provider: {
                      verificationStatus: { in: ['pending', 'approved', 'verified'] },
                      acceptsNewClients: true,
                      profileCompleted: true,
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            services: {
              where: {
                active: true,
                provider: {
                  verificationStatus: { in: ['pending', 'approved', 'verified'] },
                  acceptsNewClients: true,
                  profileCompleted: true,
                },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return {
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.iconName,
        serviceCount: cat._count.services,
        subcategories: cat.subcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          serviceCount: sub._count.services,
        })),
      })),
    };
  }

  /**
   * Get related services using AI embeddings from service media
   */
  async getRelatedServices(serviceId: string) {
    try {
      console.log(`🔍 Finding related services for service: ${serviceId}`);

      // Get current service info
      const currentService = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { category: true },
      });

      if (!currentService) {
        console.log('❌ Service not found');
        return this.getRelatedServicesByCategory(serviceId);
      }

      console.log(
        `📋 Current service: "${currentService.title}" (Category: ${currentService.category.name})`
      );

      // Get ALL media from current service with embeddings
      const currentServiceMedia = await prisma.$queryRaw<
        Array<{
          media_id: string;
          ai_embedding: string;
          visual_embedding: string;
          ai_tags: string[];
          file_url: string;
        }>
      >`
        SELECT 
          sm."id" as media_id,
          sm."aiEmbedding"::text as ai_embedding,
          sm."visualEmbedding"::text as visual_embedding,
          sm."aiTags" as ai_tags,
          sm."fileUrl" as file_url
        FROM "ServiceMedia" sm
        WHERE sm."serviceId" = ${serviceId}
          AND sm."processingStatus" = 'completed'
          AND sm."aiEmbedding" IS NOT NULL
          AND sm."visualEmbedding" IS NOT NULL
      `;

      console.log(
        `📸 Found ${currentServiceMedia.length} media with embeddings in current service`
      );

      if (currentServiceMedia.length === 0) {
        console.log('⚠️ No media with embeddings found, falling back to category matching');
        return this.getRelatedServicesByCategory(serviceId);
      }

      // Compare ALL current service media with ALL other services' media
      console.log('🔄 Comparing with all other services...');

      const allMatches = await prisma.$queryRaw<
        Array<{
          service_id: string;
          service_title: string;
          category_id: string;
          media_id: string;
          media_url: string;
          media_thumbnail: string;
          ai_tags: string[];
          ai_description: string;
          similarity: number;
          current_media_id: string;
        }>
      >`
        WITH current_media AS (
          SELECT 
            sm."id" as media_id,
            sm."aiEmbedding"::text as ai_embedding,
            sm."visualEmbedding"::text as visual_embedding
          FROM "ServiceMedia" sm
          WHERE sm."serviceId" = ${serviceId}
            AND sm."processingStatus" = 'completed'
            AND sm."aiEmbedding" IS NOT NULL
            AND sm."visualEmbedding" IS NOT NULL
        )
        SELECT 
          s.id as service_id,
          s.title as service_title,
          s."categoryId" as category_id,
          sm."id" as media_id,
          sm."fileUrl" as media_url,
          sm."thumbnailUrl" as media_thumbnail,
          sm."aiTags" as ai_tags,
          sm."aiDescription" as ai_description,
          -- Multi-vector weighted similarity
          (
            (1 - (sm."aiEmbedding" <=> current_media.ai_embedding::vector)) * 0.7 +
            (1 - (sm."visualEmbedding" <=> current_media.visual_embedding::vector)) * 0.3
          )::float as similarity,
          current_media.media_id as current_media_id
        FROM "Service" s
        INNER JOIN "ServiceMedia" sm ON s.id = sm."serviceId"
        CROSS JOIN current_media
        WHERE s.id != ${serviceId}
          AND s.active = true
          AND s."categoryId" = ${currentService.categoryId}
          AND sm."processingStatus" = 'completed'
          AND sm."aiEmbedding" IS NOT NULL
          AND sm."visualEmbedding" IS NOT NULL
        ORDER BY similarity DESC
      `;

      console.log(`🎯 Found ${allMatches.length} total matches across all media comparisons`);

      if (allMatches.length === 0) {
        console.log('⚠️ No matches found, falling back to category matching');
        return this.getRelatedServicesByCategory(serviceId);
      }

      // Group by service and get the BEST match for each service
      const serviceMatches = new Map<string, any>();

      for (const match of allMatches) {
        const serviceId = match.service_id;
        if (
          !serviceMatches.has(serviceId) ||
          serviceMatches.get(serviceId).similarity < match.similarity
        ) {
          serviceMatches.set(serviceId, match);
        }
      }

      const bestMatches = Array.from(serviceMatches.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 6);

      console.log(`🏆 Selected top ${bestMatches.length} services with best matches:`);
      bestMatches.forEach((match, index) => {
        console.log(
          `   ${index + 1}. "${match.service_title}" (similarity: ${(match.similarity * 100).toFixed(1)}%)`
        );
      });

      const similarServices = bestMatches;

      // Get full service details for the similar services
      const serviceIds = similarServices.map((s) => s.service_id);
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        include: {
          category: true,
          subcategory: true,
          provider: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      });

      // Map the results maintaining the similarity order
      return similarServices
        .map((similar) => {
          const service = services.find((s) => s.id === similar.service_id);
          if (!service) return null;

          return {
            id: service.id,
            title: service.title,
            description: service.description,
            priceMin: service.priceMin.toNumber(),
            priceMax: service.priceMax?.toNumber() || null,
            priceType: service.priceType,
            currency: service.currency,
            durationMinutes: service.durationMinutes,
            category: service.category,
            subcategory: service.subcategory,
            provider: {
              id: service.provider.id,
              businessName: service.provider.businessName,
              slug: service.provider.slug,
              logoUrl: service.provider.logoUrl,
              user: {
                firstName: service.provider.user.firstName,
                lastName: service.provider.user.lastName,
              },
            },
            featuredImage: {
              id: similar.media_id,
              fileUrl: similar.media_url,
              thumbnailUrl: similar.media_thumbnail,
            },
            bookingCount: service._count.bookings,
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error in vector similarity search:', error);
      // Fallback to category-based matching
      return this.getRelatedServicesByCategory(serviceId);
    }
  }

  /**
   * Fallback method for category-based matching
   */
  private async getRelatedServicesByCategory(serviceId: string) {
    const currentService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
        subcategory: true,
        provider: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!currentService) {
      throw new Error('Service not found');
    }

    const relatedServices = await prisma.service.findMany({
      where: {
        AND: [
          { id: { not: serviceId } },
          { active: true },
          {
            OR: [
              { categoryId: currentService.categoryId },
              ...(currentService.subcategoryId
                ? [{ subcategoryId: currentService.subcategoryId }]
                : []),
              { providerId: currentService.providerId },
            ],
          },
        ],
      },
      include: {
        category: true,
        subcategory: true,
        provider: {
          include: {
            user: true,
          },
        },
        media: {
          where: { isFeatured: true },
          take: 1,
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      take: 6,
      orderBy: [
        { categoryId: 'asc' },
        { subcategoryId: 'asc' },
        { bookings: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    return relatedServices.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      priceMin: service.priceMin.toNumber(),
      priceMax: service.priceMax?.toNumber() || null,
      priceType: service.priceType,
      currency: service.currency,
      durationMinutes: service.durationMinutes,
      category: service.category,
      subcategory: service.subcategory,
      provider: {
        id: service.provider.id,
        businessName: service.provider.businessName,
        slug: service.provider.slug,
        logoUrl: service.provider.logoUrl,
        user: {
          firstName: service.provider.user.firstName,
          lastName: service.provider.user.lastName,
        },
      },
      featuredImage: service.media[0] || null,
      bookingCount: service._count.bookings,
    }));
  }

  /**
   * Get service reviews
   */
  async getServiceReviews(serviceId: string) {
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Get reviews for this service
    const reviews = await prisma.booking.findMany({
      where: {
        serviceId,
        bookingStatus: 'COMPLETED',
        review: {
          isNot: null,
        },
      },
      include: {
        client: true,
        review: true,
      },
      orderBy: {
        review: {
          createdAt: 'desc',
        },
      },
      take: 10,
    });

    return reviews.map((booking) => ({
      id: booking.id,
      rating: booking.review?.overallRating || 0,
      comment: booking.review?.reviewText || '',
      createdAt: booking.review?.createdAt || booking.createdAt,
      client: {
        name: `${booking.client.firstName} ${booking.client.lastName}`,
        avatarUrl: booking.client.avatarUrl,
      },
    }));
  }
}

export const serviceService = new ServiceService();
