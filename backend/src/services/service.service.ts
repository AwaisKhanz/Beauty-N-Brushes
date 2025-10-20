import { prisma } from '../config/database';
import { aiService } from '../lib/ai';
import type { CreateServiceData } from '../types/service.types';
import type { SaveServiceMediaRequest } from '../../../shared-types';
import type { Prisma } from '@prisma/client';

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
          depositRequired: true, // Always required
          depositType: data.depositType,
          depositAmount: data.depositAmount,
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
    // Verify service belongs to user and get service details for multimodal context
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
      service.description,
      service.category.name,
      service.subcategory?.name,
    ]
      .filter(Boolean)
      .join(' - ');

    // Delete existing media first (to handle reordering)
    await prisma.serviceMedia.deleteMany({
      where: { serviceId },
    });

    // TWO-STAGE AI ANALYSIS for better matching
    // Stage 1: Extract visual features (tags)
    // Stage 2: Generate embedding with ENRICHED context (service info + AI tags)
    const analyzedMedia = await Promise.all(
      mediaData.map(async (media) => {
        if (media.mediaType === 'image') {
          try {
            console.log(`🤖 Analyzing image: ${media.url}`);

            // Fetch the image from local storage and convert to base64
            const imageResponse = await fetch(media.url);
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            }

            const imageArrayBuffer = await imageResponse.arrayBuffer();
            const imageBuffer = Buffer.from(imageArrayBuffer);
            const base64Image = imageBuffer.toString('base64');

            // STAGE 1: AI Vision Analysis - Extract visual features (CATEGORY-AWARE)
            console.log(
              `   📊 Stage 1: Extracting visual features for ${service.category.name}...`
            );
            const analysis = await aiService.analyzeImageFromBase64(
              base64Image,
              service.category.name // Pass category for specialized analysis
            );

            // STAGE 2: Generate ENRICHED MULTIMODAL Embedding
            // Combine: Service context + AI-extracted visual features
            // This creates better matching because embedding includes both:
            // - Semantic meaning (what service is about)
            // - Visual features (what image shows)
            console.log(`   🧠 Stage 2: Generating enriched embedding...`);

            const enrichedContext = [
              serviceContext, // "Knotless Box Braids - Medium length... - Hair"
              ...analysis.tags.slice(0, 10), // Top 10 visual feature tags
            ]
              .filter(Boolean)
              .join(' ');

            const embedding = await aiService.generateMultimodalEmbedding(
              imageBuffer,
              enrichedContext // Service info + AI visual tags
            );

            // Format embedding for PostgreSQL vector type
            const embeddingStr = `[${embedding.join(',')}]`;

            console.log(`   ✅ Analysis complete!`);
            console.log(`      Tags: ${analysis.tags.slice(0, 8).join(', ')}`);
            console.log(`      Context: "${enrichedContext.substring(0, 80)}..."`);
            console.log(`      Embedding: ${embedding.length}-dim MULTIMODAL vector`);

            return {
              ...media,
              aiTags: analysis.tags,
              aiEmbedding: embeddingStr,
              colorPalette: null, // Removed - not needed for matching
            };
          } catch (error) {
            console.error('❌ AI analysis failed for image:', error);
            // Continue with default values if analysis fails
            const emptyEmbedding = new Array(1408).fill(0);
            const embeddingStr = `[${emptyEmbedding.join(',')}]`;

            return {
              ...media,
              aiTags: [],
              aiEmbedding: embeddingStr,
              colorPalette: null,
            };
          }
        }
        // Videos don't get AI analysis yet
        const emptyEmbedding = new Array(1408).fill(0);
        const embeddingStr = `[${emptyEmbedding.join(',')}]`;

        return {
          ...media,
          aiTags: [],
          aiEmbedding: embeddingStr,
          colorPalette: null,
        };
      })
    );

    // Create media records with AI data
    // Note: Using raw SQL for vector insertion since Prisma doesn't fully support vector type
    for (const media of analyzedMedia) {
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
          "colorPalette",
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
          ${media.displayOrder || 0}::integer,
          ${media.aiTags}::text[],
          ${media.aiEmbedding}::vector,
          ${media.colorPalette ? JSON.stringify(media.colorPalette) : null}::jsonb,
          'completed'::text,
          'pending'::text,
          NOW(),
          NOW()
        )
      `;
    }

    return { count: analyzedMedia.length };
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
    const prompt = `Generate a compelling ${tone} service description for a beauty/wellness service:

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

    // Build provider filter separately
    const providerFilter: Prisma.ProviderProfileWhereInput = {
      user: {
        status: 'ACTIVE',
      },
      verificationStatus: 'approved',
      acceptsNewClients: true,
      profilePaused: false,
    };

    // Add location filters
    if (filters.city) {
      providerFilter.city = {
        equals: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters.state) {
      providerFilter.state = {
        equals: filters.state,
        mode: 'insensitive',
      };
    }

    // Add rating filter
    if (filters.rating !== undefined) {
      providerFilter.averageRating = {
        gte: filters.rating,
      };
    }

    // Add mobile service filter
    if (filters.mobileService !== undefined) {
      providerFilter.mobileServiceAvailable = filters.mobileService;
    }

    // Add salon vs solo filter
    if (filters.isSalon !== undefined) {
      providerFilter.isSalon = filters.isSalon;
    }

    // Build main where clause
    const where: Prisma.ServiceWhereInput = {
      active: true,
      provider: providerFilter,
    };

    // Text search (service title and description)
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (filters.category) {
      where.category = {
        slug: filters.category,
      };
    }

    // Subcategory filter
    if (filters.subcategory) {
      where.subcategory = {
        slug: filters.subcategory,
      };
    }

    // Price range filter
    if (filters.priceMin !== undefined) {
      where.priceMin = {
        gte: filters.priceMin,
      };
    }

    if (filters.priceMax !== undefined) {
      where.priceMin = {
        ...(where.priceMin as Prisma.DecimalFilter),
        lte: filters.priceMax,
      };
    }

    // Build orderBy using Prisma's generated type
    let orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: 'desc' };

    switch (sort.field) {
      case 'price':
        orderBy = { priceMin: sort.order };
        break;
      case 'rating':
        orderBy = { provider: { averageRating: sort.order } };
        break;
      case 'createdAt':
        orderBy = { createdAt: sort.order };
        break;
      case 'distance':
        // Distance sorting requires raw SQL with lat/long calculation
        // For now, default to relevance
        orderBy = { createdAt: 'desc' };
        break;
      default:
        // Relevance: newest first
        orderBy = { createdAt: 'desc' };
    }

    // Get services
    const services = await prisma.service.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    // Calculate distance if lat/lng provided
    const servicesWithDistance = services.map((service) => {
      let distance: number | undefined;

      if (
        filters.latitude &&
        filters.longitude &&
        service.provider.latitude &&
        service.provider.longitude
      ) {
        // Haversine formula for distance calculation
        const R = 3959; // Earth's radius in miles
        const lat1 = (filters.latitude * Math.PI) / 180;
        const lat2 = (service.provider.latitude.toNumber() * Math.PI) / 180;
        const dLat = ((service.provider.latitude.toNumber() - filters.latitude) * Math.PI) / 180;
        const dLon = ((service.provider.longitude.toNumber() - filters.longitude) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      return {
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
        distance,
      };
    });

    // Filter by radius if distance calculated
    let filteredServices = servicesWithDistance;
    if (filters.radius && filters.latitude && filters.longitude) {
      filteredServices = servicesWithDistance.filter(
        (s) => s.distance !== undefined && s.distance <= filters.radius!
      );
    }

    // Sort by distance if requested
    if (sort.field === 'distance' && filters.latitude && filters.longitude) {
      filteredServices.sort((a, b) => {
        const distA = a.distance || Infinity;
        const distB = b.distance || Infinity;
        return sort.order === 'asc' ? distA - distB : distB - distA;
      });
    }

    return {
      services: filteredServices,
      total: filteredServices.length,
      page,
      limit,
      totalPages: Math.ceil(filteredServices.length / limit),
      appliedFilters: filters,
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
          verificationStatus: 'approved',
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
                      verificationStatus: 'approved',
                      acceptsNewClients: true,
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
                  verificationStatus: 'approved',
                  acceptsNewClients: true,
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
}

export const serviceService = new ServiceService();
