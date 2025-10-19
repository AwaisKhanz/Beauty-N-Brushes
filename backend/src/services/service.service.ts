import { prisma } from '../config/database';
import { aiService } from '../lib/ai';
import type { CreateServiceData } from '../types/service.types';

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
  async uploadServiceMedia(userId: string, serviceId: string, mediaData: any[]) {
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

    // Analyze images with AI and generate embeddings
    const analyzedMedia = await Promise.all(
      mediaData.map(async (media) => {
        if (media.mediaType === 'image') {
          try {
            console.log(`Analyzing image: ${media.url}`);

            // Fetch the image from local storage and convert to base64
            // This works for localhost URLs that AI APIs can't access directly
            const imageResponse = await fetch(media.url);
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            }

            const imageArrayBuffer = await imageResponse.arrayBuffer();
            const imageBuffer = Buffer.from(imageArrayBuffer);
            const base64Image = imageBuffer.toString('base64');

            // Analyze image using base64 (works with localhost URLs)
            const analysis = await aiService.analyzeImageFromBase64(base64Image);

            // Generate MULTIMODAL vector embedding (image + text context)
            // This combines visual features + semantic meaning for better matching
            // Uses 1408 dimensions for maximum detail (texture, color, lighting, context)
            const embedding = await aiService.generateMultimodalEmbedding(
              imageBuffer,
              serviceContext // Service title, description, category
            );

            // Format embedding for PostgreSQL vector type
            const embeddingStr = `[${embedding.join(',')}]`;

            console.log(`✅ AI analysis complete for ${media.url}`);
            console.log(`   Tags: ${analysis.tags.join(', ')}`);
            console.log(`   Embedding: ${embedding.length}-dim MULTIMODAL vector (image + text)`);

            return {
              ...media,
              aiTags: analysis.tags,
              aiEmbedding: embeddingStr,
              colorPalette: analysis.dominantColors ? { colors: analysis.dominantColors } : null,
            };
          } catch (error) {
            console.error('AI analysis failed for image:', error);
            // Continue with default values if analysis fails
            // Use empty 1408-dimension vector for multimodal embedding (required field)
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
        // Use empty 1408-dimension vector for multimodal embedding (required field)
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
}

export const serviceService = new ServiceService();
