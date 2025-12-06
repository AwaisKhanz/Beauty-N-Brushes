/**
 * AI Service with Google Cloud AI
 * Uses Google Cloud Vision AI and Vertex AI (Gemini) for all AI operations
 */

import type { PolicyGenerationParams, GeneratedPolicies } from '../types/integration.types';
import { VertexAI } from '@google-cloud/vertexai';
import vision from '@google-cloud/vision';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Type definitions
export interface ImageAnalysis {
  tags: string[];
  description?: string; // Natural language description (3-5 sentences)
  dominantColors?: string[];
  faceAttributes?: {
    shape?: string;
    skinTone?: string;
    landmarks?: any[];
  };
}

export class AIService {
  private vertexAI!: VertexAI;
  private visionClient!: ImageAnnotatorClient;
  private geminiModel: any;
  private embeddingModel: any;
  private isInitialized: boolean = false;

  // Rate limiting and retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly RATE_LIMIT_DELAY_MS = 500;

  constructor() {
    // Validate required environment variables
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!projectId || !credentialsPath) {
      throw new Error(
        'Google Cloud AI is required. Please set GOOGLE_CLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS in your .env file'
      );
    }

    this.initializeGoogleAI();
  }

  /**
   * Retry helper with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const isLastAttempt = attempt === retries;
        const isRetriableError =
          error.code === 429 || // Rate limit
          error.code === 503 || // Service unavailable
          error.code === 500 || // Internal server error
          error.message?.includes('RESOURCE_EXHAUSTED') ||
          error.message?.includes('UNAVAILABLE');

        if (!isRetriableError || isLastAttempt) {
          throw error;
        }

        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(
          `⚠️  ${operationName} failed (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`
        );
        console.warn(`   Error: ${error.message}`);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`${operationName} failed after ${retries} attempts`);
  }

  /**
   * Initialize Google Cloud AI services
   */
  private initializeGoogleAI() {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      // Initialize Vertex AI for text generation and embeddings
      this.vertexAI = new VertexAI({
        project: projectId,
        location: location,
      });

      // Initialize generative model
      // Using Gemini 2.5 Flash - latest stable model (as of 2025)
      // Note: Gemini 1.0 and 1.5 models were retired in April 2025
      // Requires: Service account with "Vertex AI User" role
      this.geminiModel = this.vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      // Initialize multimodal embedding model for images
      // This is the CORRECT model for image similarity matching
      // Supports dimensions: 128, 256, 512, or 1408 (default)
      // Using 512 for optimal balance - high quality while fitting PostgreSQL index limits
      // (1408-dim exceeds btree index size limit of 2704 bytes)
      this.embeddingModel = this.vertexAI.getGenerativeModel({
        model: 'multimodalembedding@001',
      });

      // Initialize Vision AI client
      this.visionClient = new vision.ImageAnnotatorClient({
        projectId: projectId,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      this.isInitialized = true;
      console.log('✅ Google Cloud AI services initialized successfully');
      console.log(`   Project: ${projectId}`);
      console.log(`   Location: ${location}`);
      console.log(`   Services: Vision AI, Vertex AI (Gemini 2.5 Flash, Multimodal Embeddings)`);
    } catch (error: any) {
      console.error('❌ Failed to initialize Google Cloud AI services:', error);

      // Provide helpful error message
      if (
        error.message?.includes('API has not been used') ||
        error.message?.includes('not enabled')
      ) {
        const proj = process.env.GOOGLE_CLOUD_PROJECT;
        console.error('\n⚠️  Please enable the Vertex AI API:');
        console.error(
          `   1. Visit: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${proj}`
        );
        console.error('   2. Click "Enable"');
        console.error('   3. Restart the server\n');
      }

      throw new Error(
        'Failed to initialize Google Cloud AI. Please check your credentials and configuration.'
      );
    }
  }

  /**
   * Generate business policies using Google Gemini
   */
  async generatePolicies(params: PolicyGenerationParams): Promise<GeneratedPolicies> {
    this.ensureInitialized();
    const prompt = this.buildPolicyPrompt(params);

    try {
      const result = await this.geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const content = this.extractTextFromResponse(response);

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      return this.parsePolicyResponse(content);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate policies with Google AI. Please try again.');
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Google Cloud AI service is not initialized');
    }
  }

  /**
   * Extract text from Gemini response
   * Handles the response structure from @google-cloud/vertexai SDK
   */
  private extractTextFromResponse(response: any): string {
    // The response structure is: response.candidates[0].content.parts[0].text
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates in Gemini response');
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('No content parts in Gemini response');
    }

    // Concatenate all parts (Gemini may split long responses across multiple parts)
    const allParts = candidate.content.parts
      .map((part: any) => part.text || '')
      .filter((text: string) => text.length > 0);

    if (allParts.length === 0) {
      throw new Error('No text in Gemini response parts');
    }

    const fullText = allParts.join('');

    if (!fullText) {
      throw new Error('No text in Gemini response');
    }

    return fullText;
  }

  /**
   * Generate service description using Google Gemini
   */
  async generateServiceDescription(
    title: string,
    category: string,
    businessName?: string
  ): Promise<string> {
    this.ensureInitialized();

    const prompt = `Write a professional, engaging service description for "${title}" in the ${category} category${businessName ? ` at ${businessName}` : ''}.

The description should:
- Be 2-3 sentences long
- Highlight the benefits for the client
- Sound professional but friendly
- Focus on quality and results
- Be in first person ("I" or "We")

Do not include pricing or duration information.`;

    try {
      const result = await this.geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const content = this.extractTextFromResponse(response);

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      return content.trim();
    } catch (error: any) {
      console.error('Gemini error:', error);

      // Provide helpful error message for API not enabled
      if (
        error.message?.includes('404') ||
        error.message?.includes('not found') ||
        error.message?.includes('NOT_FOUND')
      ) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        console.error('\n⚠️  Gemini model not accessible. Possible causes:');
        console.error('   1. Service account needs "Vertex AI User" role');
        console.error(
          `      → Visit: https://console.cloud.google.com/iam-admin/iam?project=${projectId}`
        );
        console.error('      → Find: bnbdev@bnb-dev-475515.iam.gserviceaccount.com');
        console.error('      → Add role: "Vertex AI User"');
        console.error(
          `   2. Ensure Vertex AI API is enabled: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}`
        );
        console.error('   3. Wait 1-2 minutes after changes, then try again\n');
        throw new Error(
          'Gemini model not accessible. Grant "Vertex AI User" role to service account.'
        );
      }

      throw new Error('Failed to generate service description with Google AI.');
    }
  }

  /**
   * Generic text generation using Google Gemini
   */
  async generateText(prompt: string): Promise<string> {
    this.ensureInitialized();

    try {
      const result = await this.geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const content = this.extractTextFromResponse(response);

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      return content.trim();
    } catch (error: any) {
      console.error('Gemini error:', error);

      // Provide helpful error message for API not enabled
      if (
        error.message?.includes('404') ||
        error.message?.includes('not found') ||
        error.message?.includes('NOT_FOUND')
      ) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        console.error('\n⚠️  Gemini model not accessible. Possible causes:');
        console.error('   1. Service account needs "Vertex AI User" role');
        console.error(
          `      → Visit: https://console.cloud.google.com/iam-admin/iam?project=${projectId}`
        );
        console.error('      → Find: bnbdev@bnb-dev-475515.iam.gserviceaccount.com');
        console.error('      → Add role: "Vertex AI User"');
        console.error(
          `   2. Ensure Vertex AI API is enabled: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${projectId}`
        );
        console.error('   3. Wait 1-2 minutes after changes, then try again\n');
        throw new Error(
          'Gemini model not accessible. Grant "Vertex AI User" role to service account.'
        );
      }

      throw new Error('Failed to generate text with Google AI.');
    }
  }

  /**
   * Analyze image using Google Vision AI with retry logic
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
    this.ensureInitialized();
    return this.retryWithBackoff(
      () => this.analyzeImageWithGoogleVision(imageUrl),
      'Vision AI Analysis'
    );
  }

  /**
   * Analyze image from base64 (with optional category for better, category-specific results)
   */
  async analyzeImageFromBase64(base64Image: string, category?: string): Promise<ImageAnalysis> {
    this.ensureInitialized();
    return await this.analyzeBase64WithGoogleVision(base64Image, category);
  }

  /**
   * Google Vision AI implementation - optimized for beauty services
   */
  private async analyzeImageWithGoogleVision(imageUrl: string): Promise<ImageAnalysis> {
    try {
      // Fetch image from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return this.analyzeImageBuffer(buffer);
    } catch (error) {
      console.error('Google Vision error:', error);
      throw new Error('Failed to analyze image with Google Vision AI.');
    }
  }

  /**
   * Google Vision AI for base64 images
   */
  private async analyzeBase64WithGoogleVision(
    base64Image: string,
    category?: string
  ): Promise<ImageAnalysis> {
    try {
      const buffer = Buffer.from(base64Image, 'base64');
      return this.analyzeImageBuffer(buffer, category);
    } catch (error) {
      console.error('Google Vision error:', error);
      throw new Error('Failed to analyze image with Google Vision AI.');
    }
  }

  /**
   * Core Google Vision analysis logic - Advanced Beauty-Focused Analysis
   * Combines Vision AI (advanced features) with Gemini Vision (category-aware expertise)
   */
  private async analyzeImageBuffer(buffer: Buffer, category?: string): Promise<ImageAnalysis> {
    // Run Vision AI (for technical features) and Gemini Vision (for beauty expertise) in parallel
    const [visionResult, geminiAnalysis] = await Promise.all([
      // Vision AI for ADVANCED TECHNICAL FEATURES only
      // - Face detection: shape, landmarks, skin tone
      // - Color analysis: dominant colors, color properties
      // - Web detection: similar images, best guess labels from web
      // - Safe search: content filtering
      // NO generic labels/objects - Gemini handles that better
      this.visionClient.annotateImage({
        image: { content: buffer.toString('base64') },
        features: [
          { type: 'FACE_DETECTION', maxResults: 5 }, // Face analysis for beauty services
          { type: 'IMAGE_PROPERTIES' }, // Color analysis
          { type: 'WEB_DETECTION', maxResults: 10 }, // Find similar professional work
          { type: 'SAFE_SEARCH_DETECTION' }, // Content filtering
        ],
      }),
      // Gemini Vision for category-aware beauty expertise
      this.analyzeHairstyleWithGemini(buffer, category),
    ]);

    const result = visionResult[0];

    // Debug: Log advanced Vision AI features
    console.log('\n🔍 Advanced Vision AI Analysis:');

    // Extract professional context from Web Detection
    const webLabels = this.extractWebLabels(result);
    if (webLabels.length > 0) {
      console.log('   Web Labels (Professional Context):', webLabels.slice(0, 5).join(', '));
    }

    // Log face detection if present
    const faceCount = result.faceAnnotations?.length || 0;
    if (faceCount > 0) {
      console.log(`   Face Detection: ${faceCount} face(s) detected`);
    }

    // Log color analysis
    const colorCount = result.imagePropertiesAnnotation?.dominantColors?.colors?.length || 0;
    if (colorCount > 0) {
      console.log(`   Color Analysis: ${colorCount} dominant colors extracted`);
    }

    // Debug: Log Gemini's beauty expertise
    console.log(`\n✨ Gemini Vision Beauty Expert Analysis (${category || 'General'}):`);
    console.log('   Professional Tags:', geminiAnalysis.tags.slice(0, 8).join(', '));
    if (geminiAnalysis.description) {
      console.log(
        `   Description: ${geminiAnalysis.description.substring(0, 100)}${geminiAnalysis.description.length > 100 ? '...' : ''}`
      );
    }

    // Extract advanced features from Vision AI
    const dominantColors = this.extractDominantColors(result);
    const faceAttributes = this.analyzeFaceAttributes(result);

    // PRIMARY: Use Gemini's beauty-focused tags as the main source
    // SECONDARY: Add professional context from Web Detection (if available)
    const allTags = [...new Set([...geminiAnalysis.tags, ...webLabels])];

    const analysis: ImageAnalysis = {
      tags: allTags, // Gemini tags + Web Detection professional context (50-100+)
      description: geminiAnalysis.description, // Natural language description (3-5 sentences)
      dominantColors: dominantColors, // Vision AI color detection
      faceAttributes: faceAttributes, // Vision AI face detection
    };

    console.log('\n   ✅ Final Professional Analysis:', {
      totalTags: analysis.tags.length,
      geminiTags: geminiAnalysis.tags.length,
      webLabels: webLabels.length,
      hasDescription: !!analysis.description,
      hasFaceDetection: faceCount > 0,
      hasColorAnalysis: colorCount > 0,
    });

    return analysis;
  }

  /**
   * Analyze beauty service image using Gemini Vision (category-aware)
   * Works for ALL beauty services: hair, makeup, nails, lashes, brows, skincare, waxing, spa, etc.
   * Returns 50-100+ comprehensive tags + detailed natural language description
   */
  private async analyzeHairstyleWithGemini(
    imageBuffer: Buffer,
    serviceCategory?: string
  ): Promise<{
    tags: string[];
    description?: string;
  }> {
    try {
      const base64Image = imageBuffer.toString('base64');

      // Generate category-specific prompt (enhanced for 50-100+ tags + description)
      const prompt = this.generateCategoryAwarePrompt(serviceCategory);

      // Define strict JSON schema for structured output
      const result = await this.geminiModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: '50-100+ comprehensive tags covering all visible aspects',
              },
              description: {
                type: 'string',
                description: 'Comprehensive 3-5 sentence natural language description',
              },
            },
            required: ['tags', 'description'],
          },
        },
      });

      const response = result.response;
      const content = this.extractTextFromResponse(response);

      // With responseMimeType: 'application/json', Gemini returns valid JSON directly
      const geminiResult = JSON.parse(content);

      // Validate the response has the expected structure
      if (!geminiResult.tags || !Array.isArray(geminiResult.tags)) {
        console.warn('⚠️  Invalid response structure. Missing tags array.');
        throw new Error('Invalid response structure from Gemini Vision');
      }

      console.log(`   ✅ Parsed ${geminiResult.tags.length} tags successfully`);

      return {
        tags: geminiResult.tags,
        description: geminiResult.description || undefined,
      };
    } catch (error: any) {
      console.error('⚠️  Gemini Vision analysis failed, using fallback:', error.message);
      console.error('   Service Category:', serviceCategory);
      // Fallback to basic analysis if Gemini fails
      return {
        tags: ['beauty-service', serviceCategory || 'general'].filter(Boolean),
        description: undefined,
      };
    }
  }

  /**
   * Generate category-aware prompts for comprehensive beauty professional analysis
   * TARGET: 50-100+ ultra-comprehensive tags + detailed natural language description
   */
  private generateCategoryAwarePrompt(category?: string): string {
    const baseInstructions = `You are an expert beauty industry professional analyzing service images for a professional beauty marketplace with AI-powered visual search.

Your task: Generate the MOST COMPREHENSIVE analysis possible to enable 90-100% accurate visual matching.

Generate 50-100 ULTRA-COMPREHENSIVE tags covering EVERY visible aspect:

🔍 UNIVERSAL VISUAL ELEMENTS (ALL images):
✅ Person attributes: gender, age-range, skin-tone, face-shape, expression, emotion, mood, posture, body-language
✅ Hair: exact-color, length, texture-type, style-name, cut-type, specific-technique, shine-level, volume, part-style, hair-line
✅ Face details: eye-color, eyebrow-shape, eyebrow-color, eyebrow-style, eyelash-type, nose-shape, lip-color, lip-style, cheekbone-definition, jawline-shape
✅ Makeup (if present): foundation-coverage, contour-level, highlight-placement, blush-color, eyeshadow-colors, eyeshadow-style, eyeliner-type, mascara-type, lip-product
✅ Jewelry/Accessories: necklace, earrings, rings, bracelets, hair-accessories, glasses, material, style, color
✅ Clothing: visible-garments, neckline, sleeves, colors, patterns, style, formality-level, fabric-type

🎨 BEAUTY SERVICE SPECIFICS:
✅ Tools/Instruments: scissors, combs, brushes, curling-iron, flat-iron, blow-dryer, nail-files, buffers, massage-stones, spatulas, mirrors, towels, product-bottles, applicators
✅ Products visible: bottle-colors, jar-types, tube-brands, product-types (serum, cream, oil, polish, spray), applicator-tools
✅ Treatment specifics: massage-technique-name, waxing-method, facial-treatment-type, nail-art-technique, specific-procedure
✅ Skin condition: texture-appearance, clarity, tone-evenness, glow-level, hydration-look, visible-concerns

🌍 ENVIRONMENTAL CONTEXT:
✅ Setting: salon-chair, spa-bed, home-setting, outdoor, studio, professional-space, casual-setting
✅ Lighting: natural-light, artificial-light, warm-lighting, cool-lighting, soft-light, dramatic-light, backlit, side-lit, overhead-lighting
✅ Atmosphere: relaxing-vibe, energetic-feel, luxurious-setting, minimalist-space, cozy-environment, professional-studio, modern-decor, vintage-aesthetic
✅ Season indicators: summer-bright, winter-tones, spring-fresh, autumn-warm, seasonal-colors, weather-feel (rainy, sunny, cold, warm)
✅ Temperature feel: warm-tones, cool-tones, cozy-atmosphere, fresh-airy, humid-look, crisp-feel

😊 AESTHETIC & EMOTIONAL TAGS:
✅ Mood: happy, relaxed, confident, serene, joyful, peaceful, excited, satisfied, content, pampered
✅ Style aesthetic: natural-look, glam-style, dramatic-effect, minimalist-aesthetic, bohemian-vibe, edgy-style, classic-look, modern-aesthetic, vintage-inspired, artistic
✅ Quality indicators: professional-grade, expert-level, high-end-quality, luxury-service, polished-finish, precise-work, artistic-excellence, creative-design, masterful-execution
✅ Complexity: simple-style, moderate-skill, intricate-detail, detailed-work, masterful-technique, competition-worthy, expert-level

Focus ONLY on what's VISIBLE - no assumptions or guesses.`;

    const categorySpecificGuidelines = this.getCategoryGuidelines(category);

    return `${baseInstructions}

${categorySpecificGuidelines}

Format your response EXACTLY as JSON:
{
  "tags": ["keyword1", "keyword2", "keyword3", ..., "keyword100"],
  "description": "A comprehensive 3-5 sentence natural language description capturing the entire visual context: person details, hair/makeup/service specifics, tools/products visible, setting/lighting/atmosphere, mood/aesthetic, and professional quality. Be specific, detailed, and use industry terminology."
}

CRITICAL PROFESSIONAL STANDARDS:
✅ DO:
- Generate 50-100+ specific, professional keywords from what you SEE
- Use industry-standard terminology AND common client search terms
- Include ALL style descriptors (e.g., "natural-glam", "high-fade", "french-tip", "warm-lighting")
- Specify ALL techniques visible (e.g., "balayage", "box-braids", "ombre-nails", "contour-blending")
- Describe ALL textures, finishes, lengths, shapes, colors, patterns, materials
- Include complexity AND quality indicators (simple, moderate, intricate, masterclass-level, professional-grade)
- Add occasion tags if clear (bridal, editorial, everyday, red-carpet, special-event)
- Use compound keywords (e.g., "long-natural-nails", "dark-smokey-eye", "soft-warm-lighting")
- Tag EVERY visible tool, product, instrument, accessory
- Capture environmental context: setting, lighting, atmosphere, season feel
- Include emotional/mood tags: happy, relaxed, confident, serene
- Write detailed 3-5 sentence description using professional terminology

❌ DON'T:
- Skip visible elements - tag EVERYTHING
- Use vague generic terms: "person", "face", "photo", "image"
- Make assumptions about things not visible
- Include brand names or product names
- Use vague descriptors: "nice", "good", "pretty"
- Be brief - be COMPREHENSIVE (50-100+ tags minimum)

Respond ONLY with valid JSON. No explanations, no other text.`;
  }

  /**
   * Get category-specific analysis guidelines
   */
  private getCategoryGuidelines(category?: string): string {
    const lowerCategory = category?.toLowerCase() || '';

    // HAIR SERVICES
    if (lowerCategory.includes('hair')) {
      return `HAIR SERVICE ANALYSIS - Analyze ALL visible hair characteristics:

**TEXTURE & HAIR TYPE** (Critical for matching):
- Natural texture: 4c-hair, 4b-coils, 4a-coils, 3c-curls, 3b-curls, 3a-curls, 2c-wavy, 2b-wavy, 2a-wavy, 1c-straight, 1b-straight, 1a-straight
- Texture state: natural-texture, heat-styled, chemically-treated, relaxed-hair, texturized
- Characteristics: tight-coils, loose-coils, kinky-curls, defined-curls, frizzy, smooth-straight

**STYLE & TECHNIQUE** (What clients search for):
- Protective styles: box-braids, knotless-braids, goddess-braids, cornrows, feed-in-braids, tribal-braids, fulani-braids
- Locs: starter-locs, traditional-locs, faux-locs, loc-retwist, sisterlocks, microlocs
- Natural styles: twist-out, braid-out, wash-and-go, finger-coils, rod-set, bantu-knots
- Heat styles: silk-press, blowout, flat-iron, sleek-straight, bouncy-curls
- Extensions: sew-in, quick-weave, wig-install, closure-install, frontal-install
- Men's cuts: fade-haircut, taper-fade, low-fade, mid-fade, high-fade, skin-fade, burst-fade, drop-fade, temp-fade

**CUT & SHAPE**:
- Women's: bob, lob, pixie, shag, layers, blunt-cut, shoulder-length, long-layers, asymmetric
- Men's: crew-cut, buzz-cut, undercut, pompadour, quiff, frohawk, caesar-cut, textured-crop

**LENGTH**: short-hair, medium-length, long-hair, shoulder-length, bra-strap-length, waist-length, extra-long

**COLOR WORK** (If visible):
- Techniques: balayage, highlights, lowlights, ombre, sombre, color-melt, money-pieces
- Colors: blonde, brunette, auburn, red, burgundy, platinum, ash-blonde, honey-blonde, copper
- Fashion: pastel-hair, vivid-color, rainbow-hair, split-dye, color-block

**FEATURES & FINISH**:
- Volume: voluminous, flat-roots, lifted-crown, body
- Shine: glossy, matte, natural-sheen, high-shine
- Definition: curl-definition, texture-definition, separated-curls, clumped-curls
- Overall: sleek, polished, natural-look, textured-finish, tousled, messy-chic

**COMPLEXITY**: simple-style, moderate-skill, advanced-technique, masterclass-work, intricate-braiding

**OCCASION** (If clear): everyday-hair, special-event, bridal-hair, editorial-hair, red-carpet, photoshoot`;
    }

    // MAKEUP SERVICES
    if (lowerCategory.includes('makeup')) {
      return `MAKEUP SERVICE ANALYSIS - Analyze ALL visible makeup characteristics:

**OVERALL STYLE** (Critical for matching):
- Look: natural-makeup, no-makeup-makeup, soft-glam, full-glam, dramatic-makeup, editorial-makeup, avant-garde
- Finish: matte-finish, dewy-finish, satin-finish, airbrushed-look, natural-finish, radiant-finish
- Coverage: light-coverage, medium-coverage, full-coverage, flawless-skin

**EYE MAKEUP** (What clients search for):
- Eyeshadow styles: smokey-eye, cut-crease, halo-eye, neutral-eye, colorful-eye, monochromatic
- Eyeshadow finish: matte-shadow, shimmer-shadow, glitter-eye, metallic-eye
- Eyeliner: winged-liner, cat-eye, graphic-liner, tight-line, smudged-liner, bold-liner, no-liner
- Lashes: natural-lashes, false-lashes, dramatic-lashes, wispy-lashes, volume-lashes, individual-lashes
- Brows: natural-brows, bold-brows, feathered-brows, defined-brows, ombre-brows

**LIP MAKEUP**:
- Style: nude-lips, bold-lips, ombre-lips, gradient-lips, overlining, natural-lips
- Finish: matte-lipstick, glossy-lips, satin-lips, velvet-lips, sheer-lips
- Colors: red-lips, pink-lips, berry-lips, nude-pink, mauve-lips, brown-lips, dark-lips

**FACE MAKEUP**:
- Contour: sculpted-contour, soft-contour, dramatic-contour, natural-contour, chiseled-cheekbones
- Highlight: subtle-highlight, intense-highlight, strobing, glowing-skin, natural-glow
- Blush: natural-blush, pink-blush, peach-blush, draping, flushed-cheeks
- Bronzer: sun-kissed, warm-bronzer, sculpting-bronzer

**SKIN TONE & UNDERTONES**:
- Tone: fair-skin, light-skin, medium-skin, tan-skin, deep-skin, dark-skin, ebony-skin
- Undertones: warm-undertones, cool-undertones, neutral-undertones, olive-undertones

**COMPLEXITY & SKILL**:
- Level: simple-makeup, moderate-skill, advanced-technique, professional-artistry, masterclass-work
- Detail: clean-lines, precise-application, blended, seamless, intricate-detail

**OCCASION** (If clear):
- everyday-makeup, office-makeup, date-night, special-event, bridal-makeup, wedding-guest, prom-makeup, editorial-shoot, red-carpet, photoshoot, party-makeup, festival-makeup`;
    }

    // NAIL SERVICES
    if (lowerCategory.includes('nail')) {
      return `NAIL SERVICE ANALYSIS - Analyze ALL visible nail characteristics:

**NAIL SHAPE** (Critical for style matching):
- Shapes: square-nails, squoval-nails, round-nails, oval-nails, almond-nails, stiletto-nails, coffin-nails, ballerina-nails, lipstick-shape, edge-nails, mountain-peak

**NAIL LENGTH**:
- Length: natural-short, short-nails, medium-nails, long-nails, extra-long-nails, xl-nails

**NAIL TYPE & APPLICATION**:
- Type: natural-nails, acrylic-nails, gel-nails, gel-x, dip-powder-nails, press-on-nails, builder-gel
- Enhancement: nail-extensions, tips, overlay, sculpted-nails

**DESIGN STYLE** (What clients search for):
- Classic: french-manicure, french-tips, reverse-french, american-manicure, bare-nails
- Modern: ombre-nails, gradient-nails, chrome-nails, mirror-nails, glazed-donut-nails
- Artistic: nail-art, hand-painted-nails, detailed-art, abstract-nails, artistic-nails
- 3D & Texture: 3d-nails, embellished-nails, textured-nails, dimensional-art
- Trendy: jelly-nails, milk-bath-nails, glass-nails, aura-nails, swirl-nails, marble-nails

**DESIGN ELEMENTS**:
- Patterns: floral-nails, geometric-nails, animal-print, stripes, polka-dots, abstract-design
- Effects: glitter-nails, sparkle, holographic, iridescent, metallic-nails, shimmer
- Embellishments: rhinestones, crystals, gems, studs, pearls, charms, gold-foil, silver-foil
- Techniques: stamping, water-marble, freehand, airbrushed-nails

**COLOR & FINISH**:
- Colors: nude-nails, red-nails, pink-nails, black-nails, white-nails, pastel-nails, neon-nails, jewel-tones
- Specific: burgundy, emerald-green, royal-blue, lavender, coral, mint-green
- Finish: matte-nails, glossy-nails, satin-finish, velvet-nails, glass-finish

**COMPLEXITY & SKILL**:
- Simple: solid-color, minimalist-nails, clean-nails, simple-design
- Moderate: accent-nail, simple-art, two-tone, basic-french
- Advanced: intricate-art, detailed-design, complex-patterns, mixed-media
- Expert: masterclass-work, artistic-excellence, competition-worthy, editorial-nails

**OCCASION** (If clear):
- everyday-nails, office-appropriate, special-event, bridal-nails, wedding-nails, holiday-nails, summer-nails, winter-nails, vacation-nails`;
    }

    // LASH SERVICES
    if (lowerCategory.includes('lash')) {
      return `LASH SERVICE ANALYSIS - Analyze ALL visible lash characteristics:

**LASH TYPE & APPLICATION**:
- Extensions: lash-extensions, classic-lashes, volume-lashes, mega-volume-lashes, hybrid-lashes, russian-volume
- Temporary: strip-lashes, false-lashes, individual-lashes, cluster-lashes, magnetic-lashes
- Natural: lash-lift, lash-tint, lash-perm, natural-lashes

**STYLE & LOOK** (What clients search for):
- Effect: natural-lashes, natural-glam, glamorous-lashes, dramatic-lashes, wispy-lashes, spiky-lashes
- Shape: cat-eye-lashes, doll-eye-lashes, open-eye, almond-eye, squirrel-lashes, dolly-lashes

**LENGTH & CURL**:
- Length: short-lashes, natural-length, medium-length, long-lashes, extra-long, dramatic-length
- Curl: j-curl, b-curl, c-curl, d-curl, l-curl, m-curl, u-curl, natural-curl, lifted-curl

**FULLNESS & DENSITY**:
- Volume: natural-volume, full-volume, dramatic-volume, mega-volume, ultra-volume
- Density: sparse, medium-density, dense-lashes, full-set, fluffy-lashes

**CHARACTERISTICS**:
- Texture: fluffy, feathery, separated, layered, textured, uniform
- Finish: glossy-lashes, matte-lashes, natural-finish

**COMPLEXITY**:
- Simple: classic-set, natural-enhancement
- Moderate: hybrid-set, volume-set
- Advanced: mega-volume, intricate-mapping, custom-design`;
    }

    // BROW SERVICES
    if (lowerCategory.includes('brow')) {
      return `BROW SERVICE ANALYSIS - Analyze ALL visible brow characteristics:

**BROW SHAPE** (Critical for matching):
- Arch: high-arch, soft-arch, straight-brows, angled-brows, rounded-brows, low-arch
- Style: natural-shape, sculpted-brows, clean-brows, defined-shape, lifted-brows

**BROW FULLNESS & THICKNESS**:
- Full: bold-brows, thick-brows, full-brows, bushy-brows
- Medium: natural-brows, moderate-thickness
- Thin: thin-brows, delicate-brows, pencil-thin

**BROW TEXTURE & FINISH**:
- Natural: fluffy-brows, feathered-brows, natural-texture, brushed-up
- Groomed: sleek-brows, polished-brows, precise-brows, clean-edges
- Enhanced: laminated-brows, brow-gel, set-brows, soap-brows

**TECHNIQUE & SERVICE** (If identifiable):
- Shaping: threading, waxing, tweezing, trimming
- Color: brow-tint, henna-brows, color-matched, darker-brows, lighter-brows
- Semi-permanent: microblading, powder-brows, ombre-brows, combination-brows, nanoblading
- Temporary: brow-pencil, brow-pomade, brow-powder, filled-brows

**STYLE & LOOK**:
- Natural: natural-brows, barely-there, subtle-enhancement
- Defined: defined-brows, structured-brows, sharp-lines
- Bold: bold-brows, statement-brows, instagram-brows, dramatic-brows

**COMPLEXITY**:
- Simple: basic-grooming, cleanup, tinting
- Moderate: shaping, filling, defining
- Advanced: microblading, ombre-technique, custom-mapping`;
    }

    // SKINCARE SERVICES
    if (lowerCategory.includes('skin') || lowerCategory.includes('facial')) {
      return `SKINCARE/FACIAL SERVICE ANALYSIS - Analyze ALL visible skincare characteristics:

**TREATMENT TYPE**:
- Basic: facial, classic-facial, european-facial, deep-cleansing-facial
- Advanced: chemical-peel, microdermabrasion, dermaplaning, hydrafacial, oxygen-facial
- Specialized: acne-facial, anti-aging-facial, brightening-facial, hydrating-facial
- Extraction: blackhead-removal, extraction-facial, deep-pore-cleansing

**SKIN CONDITION** (If visible):
- Type: oily-skin, dry-skin, combination-skin, sensitive-skin, normal-skin, mature-skin
- Concerns: acne-prone, anti-aging, hyperpigmentation, dark-spots, fine-lines, wrinkles, dullness, dehydration

**RESULTS & BENEFITS** (If visible):
- Glow: glowing-skin, radiant-skin, dewy-skin, luminous-skin, healthy-glow
- Texture: smooth-skin, soft-skin, refined-texture, even-texture
- Clarity: clear-skin, bright-skin, even-tone, fresh-skin
- Firmness: lifted-skin, tightened-skin, plump-skin

**TECHNIQUES & MODALITIES**:
- Manual: facial-massage, lymphatic-drainage, gua-sha, facial-cupping
- Exfoliation: enzyme-peel, glycolic-peel, lactic-acid, microdermabrasion
- Technology: led-therapy, microcurrent, ultrasound, radiofrequency
- Masks: clay-mask, sheet-mask, hydrating-mask, brightening-mask

**ATMOSPHERE** (If visible):
- Setting: spa-setting, treatment-room, relaxing-environment, luxury-spa
- Experience: pampering, rejuvenation, self-care, wellness`;
    }

    // WAXING SERVICES
    if (lowerCategory.includes('wax')) {
      return `WAXING SERVICE ANALYSIS - Analyze visible waxing characteristics:

**BODY AREA** (Critical for service matching):
- Face: eyebrow-wax, lip-wax, chin-wax, sideburn-wax, full-face-wax
- Body: leg-wax, arm-wax, underarm-wax, back-wax, chest-wax, stomach-wax
- Bikini: bikini-wax, brazilian-wax, hollywood-wax, extended-bikini, landing-strip

**RESULTS** (If visible):
- Finish: smooth-skin, hair-free, clean-skin, groomed, silky-skin
- Duration: long-lasting, semi-permanent-hair-removal

**TECHNIQUE & TYPE**:
- Method: hard-wax, soft-wax, strip-wax, sugaring, wax-strips
- Application: professional-waxing, precision-waxing

**SKIN CONDITION** (If visible):
- skin-type: sensitive-skin, normal-skin, all-skin-types
- Results: no-irritation, smooth-results, clean-finish`;
    }

    // SPA & WELLNESS
    if (
      lowerCategory.includes('spa') ||
      lowerCategory.includes('massage') ||
      lowerCategory.includes('wellness')
    ) {
      return `SPA/WELLNESS SERVICE ANALYSIS - Analyze visible spa/wellness characteristics:

**TREATMENT TYPE**:
- Massage: swedish-massage, deep-tissue, hot-stone-massage, aromatherapy-massage, sports-massage, prenatal-massage
- Body: body-scrub, body-wrap, body-polish, exfoliation, detox-wrap
- Hydrotherapy: jacuzzi, steam-room, sauna, hydrotherapy-bath
- Specialty: reflexology, thai-massage, shiatsu, couples-massage

**ENVIRONMENT & SETTING** (If visible):
- Ambiance: relaxing-spa, luxury-spa, tranquil-setting, peaceful-environment, zen-space
- Features: spa-room, massage-table, treatment-room, spa-suite, private-room
- Elements: candles, aromatherapy, calming-music, dim-lighting, natural-elements

**WELLNESS FOCUS**:
- Benefits: relaxation, stress-relief, tension-relief, muscle-relief, pain-management
- Results: rejuvenation, renewal, wellness, self-care, healing, balance
- Experience: pampering, therapeutic, restorative, calming, peaceful

**MODALITY STYLE**:
- Pressure: gentle, moderate, firm, deep-pressure, light-touch
- Technique: kneading, stroking, compression, stretching, acupressure
- Approach: holistic, therapeutic, clinical, relaxation-focused`;
    }

    // GENERIC/UNKNOWN CATEGORY
    return `BEAUTY & PERSONAL CARE SERVICE ANALYSIS - Comprehensive professional analysis:

**SERVICE IDENTIFICATION** (Critical - identify what service this is):
- Category: hair-service, makeup-service, nail-service, lash-service, brow-service, skincare-service, waxing-service, spa-service, body-treatment, wellness-service
- Specific service visible: haircut, color-treatment, styling, manicure, pedicure, facial, massage, etc.

**VISUAL CHARACTERISTICS**:
- Style & Technique: specific methods, approaches, styles visible in the image
- Quality Level: professional-grade, expert-work, advanced-technique, basic-service
- Finish & Result: polished, natural, dramatic, subtle, bold, understated
- Complexity: simple, moderate-complexity, detailed-work, intricate, masterclass-level

**DESIGN ELEMENTS**:
- Colors: specific colors, color combinations, color techniques visible
- Textures: smooth, textured, glossy, matte, rough, soft, silky
- Patterns: geometric, floral, abstract, organic, structured, freeform
- Shapes: specific shapes and forms visible

**FEATURES & DETAILS**:
- Technical aspects: precision, blending, application, execution
- Artistic elements: creativity, design, artistry, uniqueness
- Aesthetic: modern, classic, trendy, timeless, edgy, elegant, minimalist

**OCCASION & PURPOSE** (If identifiable):
- Daily: everyday, casual, low-maintenance, simple, practical
- Special: event, wedding, bridal, prom, party, celebration, formal
- Professional: photoshoot, editorial, red-carpet, runway, competition, portfolio

**CLIENT SEARCH TERMS** (Think like a client):
- What would someone search to find THIS exact look/service?
- Include both professional terms AND common language
- Focus on distinguishing features that make this unique

Generate 20-30 highly specific, searchable keywords that help match clients with providers offering THIS exact style/service.`;
  }

  /**
   * Extract professional context labels from Web Detection
   * Uses Google's web entity detection to find similar professional work
   */
  private extractWebLabels(result: any): string[] {
    const labels = new Set<string>();

    // Extract best guess labels (what Google thinks this image shows)
    const bestGuessLabels = result.webDetection?.bestGuessLabels || [];
    bestGuessLabels.forEach((label: any) => {
      if (label.label) {
        // Split multi-word labels and add them
        const words = label.label
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((word: string) => word.length > 2);
        words.forEach((word: string) => labels.add(word));
      }
    });

    // Extract web entities (recognized concepts from similar professional images)
    const webEntities = result.webDetection?.webEntities || [];
    webEntities.forEach((entity: any) => {
      if (entity.score > 0.6 && entity.description) {
        // Only add relevant beauty/professional terms
        const desc = entity.description.toLowerCase();

        // Filter out generic/irrelevant terms
        const genericTerms = ['person', 'people', 'human', 'photo', 'image', 'picture', 'model'];
        const isGeneric = genericTerms.some((term) => desc === term);

        if (!isGeneric && desc.length > 2) {
          labels.add(desc);
        }
      }
    });

    return Array.from(labels);
  }

  /**
   * Extract dominant colors as hex codes
   */
  private extractDominantColors(result: any): string[] {
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    return colors.slice(0, 3).map((color: any) => {
      const { red, green, blue } = color.color;
      return `#${Math.round(red).toString(16).padStart(2, '0')}${Math.round(green).toString(16).padStart(2, '0')}${Math.round(blue).toString(16).padStart(2, '0')}`;
    });
  }

  /**
   * Analyze face attributes for beauty services
   */
  private analyzeFaceAttributes(result: any): ImageAnalysis['faceAttributes'] {
    const faces = result.faceAnnotations || [];

    if (faces.length === 0) return undefined;

    const face = faces[0]; // Primary face

    return {
      shape: this.detectFaceShape(face),
      skinTone: this.detectSkinTone(result),
      landmarks: face.landmarks,
    };
  }

  /**
   * Detect face shape from landmarks
   */
  private detectFaceShape(face: any): string {
    if (!face.fdBoundingPoly) return 'oval';

    const vertices = face.fdBoundingPoly.vertices;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[1].y);
    const ratio = width / height;

    if (ratio < 0.7) return 'long';
    if (ratio > 1.3) return 'wide';
    if (ratio > 0.9 && ratio < 1.1) return 'round';
    return 'oval';
  }

  /**
   * Detect skin tone from image colors
   */
  private detectSkinTone(result: any): string {
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    // Simplified skin tone detection
    for (const color of colors) {
      const { red, green, blue } = color.color;

      // Check if color is in skin tone range
      if (red > 100 && green > 50 && blue > 20 && red > green && green > blue) {
        if (red > 200 && green > 170) return 'light';
        if (red > 150 && green > 100) return 'medium';
        return 'dark';
      }
    }

    return 'medium';
  }

  /**
   * Generate embeddings for vector search from IMAGE
   * Uses Google's Multimodal Embedding Model via REST API
   *
   * This is Google's production-ready solution for image similarity:
   * - Returns 1408-dimensional vectors (MAX) for highest accuracy
   * - Based on advanced deep learning models trained on billions of images
   * - Captures semantic meaning, visual features, and context
   * - Higher dimensions = more expressive, better for subtle differences in hairstyles
   *
   * @param imageBuffer Raw image buffer (JPEG, PNG, etc.)
   * @param dimension Optional dimension (128, 256, 512, or 1408). Default: 1408 (max)
   * @returns Vector embedding optimized for cosine similarity search
   */
  async generateImageEmbedding(
    imageBuffer: Buffer,
    dimension: 128 | 256 | 512 | 1408 = 1408
  ): Promise<number[]> {
    this.ensureInitialized();

    // Use retry logic with exponential backoff
    return this.retryWithBackoff(async () => {
      // Convert image to base64 for API
      const base64Image = imageBuffer.toString('base64');

      // Validate image size (Google has limits)
      const imageSizeMB = imageBuffer.length / (1024 * 1024);
      if (imageSizeMB > 10) {
        throw new Error(
          `Image size ${imageSizeMB.toFixed(2)}MB exceeds 10MB limit. Please compress the image.`
        );
      }

      const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      // Get access token for authentication
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('Failed to get access token');
      }

      // Call Vertex AI Prediction API for multimodal embeddings
      const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/multimodalembedding@001:predict`;

      const requestBody = {
        instances: [
          {
            image: {
              bytesBase64Encoded: base64Image,
            },
          },
        ],
        parameters: {
          dimension: dimension,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as any;

      // Extract embedding from response
      const embedding = result.predictions?.[0]?.imageEmbedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid response from Vertex AI API');
      }

      // Validate embedding dimension
      if (embedding.length !== dimension) {
        console.warn(`Expected ${dimension} dimensions, got ${embedding.length}. Adjusting...`);

        if (embedding.length > dimension) {
          return embedding.slice(0, dimension);
        } else {
          return [...embedding, ...new Array(dimension - embedding.length).fill(0)];
        }
      }

      console.log(
        `✅ Generated ${dimension}-dim HIGH-QUALITY image embedding using multimodalembedding@001`
      );
      return embedding;
    }, 'Image Embedding Generation').catch((error: any) => {
      console.error('Google Multimodal Embedding error:', error);

      // Provide helpful error messages
      if (error.message?.includes('403') || error.message?.includes('permission')) {
        throw new Error(
          'Permission denied. Please ensure the Vertex AI API is enabled and your service account has the correct permissions.'
        );
      }

      if (error.message?.includes('404')) {
        throw new Error(
          'Model not found. Please ensure multimodalembedding@001 is available in your region.'
        );
      }

      if (error.message?.includes('quota')) {
        throw new Error(
          'Google Cloud quota exceeded. Please check your API limits or wait before retrying.'
        );
      }

      throw new Error(`Failed to generate image embedding: ${error.message || 'Unknown error'}`);
    });
  }

  /**
   * Generate multimodal embedding (image + optional text context)
   * - Returns 512-dimensional vectors (optimal for PostgreSQL indexing)
   * - Supports both pure image and image+text multimodal embeddings
   *
   * @param imageSource URL of the image to embed OR Buffer containing image data
   * @param textContext Optional text context to enrich the embedding
   * @param dimension Optional dimension (128, 256, 512, or 1408). Default: 512 (optimal)
   * @returns Embedding vector
   */
  async generateMultimodalEmbedding(
    imageSource: string | Buffer,
    textContext?: string,
    dimension: 128 | 256 | 512 | 1408 = 512
  ): Promise<number[]> {
    this.ensureInitialized();

    return this.retryWithBackoff(async () => {
      let imageBuffer: Buffer;
      
      // Handle both URL string and Buffer input
      if (Buffer.isBuffer(imageSource)) {
        imageBuffer = imageSource;
      } else {
        const imageResponse = await fetch(imageSource);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageSource} - ${imageResponse.statusText}`);
        }
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      }
      
      const base64Image = imageBuffer.toString('base64');

      // Validate image size
      const imageSizeMB = imageBuffer.length / (1024 * 1024);
      if (imageSizeMB > 10) {
        throw new Error(
          `Image size ${imageSizeMB.toFixed(2)}MB exceeds 10MB limit. Please compress the image.`
        );
      }


      const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      // Get access token
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('Failed to get access token');
      }

      // Call Vertex AI with BOTH image and text
      const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/multimodalembedding@001:predict`;

      const instance: any = {
        image: {
          bytesBase64Encoded: base64Image,
        },
      };
      if (textContext) {
        instance.text = textContext; // Include text for multimodal fusion
      }

      const requestBody = {
        instances: [instance],
        parameters: {
          dimension: dimension,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as any;

      // Extract embedding from response
      const embedding = result.predictions?.[0]?.imageEmbedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid response from Vertex AI API');
      }

      // Validate dimension
      if (embedding.length !== dimension) {
        console.warn(`Expected ${dimension} dimensions, got ${embedding.length}. Adjusting...`);
        if (embedding.length > dimension) {
          return embedding.slice(0, dimension);
        } else {
          return [...embedding, ...new Array(dimension - embedding.length).fill(0)];
        }
      }

      console.log(
        `✅ Generated ${dimension}-dim MULTIMODAL embedding (image${textContext ? '+text fusion' : ''}) using multimodalembedding@001`
      );
      if (textContext) {
        console.log(`   Text context: "${textContext.substring(0, 50)}${textContext.length > 50 ? '...' : ''}"`);
      }
      return embedding;
    }, 'Multimodal Embedding Generation').catch((error: any) => {
      console.error('Google Multimodal Embedding error:', error);
      throw new Error(
        `Failed to generate multimodal embedding: ${error.message || 'Unknown error'}`
      );
    });
  }

  /**
   * Rate-limited batch embedding generation
   * Processes multiple images with automatic rate limiting
   */
  async generateImageEmbeddingsBatch(
    imageBuffers: Buffer[],
    dimension: 128 | 256 | 512 | 1408 = 1408
  ): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      console.log(`Processing image ${i + 1}/${imageBuffers.length}...`);

      const embedding = await this.generateImageEmbedding(imageBuffers[i], dimension);
      embeddings.push(embedding);

      // Add delay between requests to avoid rate limiting (except last item)
      if (i < imageBuffers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, this.RATE_LIMIT_DELAY_MS));
      }
    }

    return embeddings;
  }

  /**
   * Generate text embeddings using Google Vertex AI
   *
   * ⚠️ DEPRECATED for image matching - Use generateImageEmbedding() instead!
   *
   * This function converts text descriptions to embeddings, which loses
   * visual information and reduces matching accuracy by 50-70%.
   *
   * Only use this for:
   * - Text-based search queries
   * - Hybrid text+image search
   * - Fallback when image is unavailable
   *
   * @param text Text to embed
   * @param dimension Dimension (128, 256, 512, or 1408)
   * @returns Text embedding vector
   */
  async generateTextEmbedding(
    text: string,
    dimension: 128 | 256 | 512 | 1408 = 512
  ): Promise<number[]> {
    this.ensureInitialized();

    console.warn(
      '⚠️  WARNING: Using text-based embeddings for image matching reduces accuracy by 50-70%.'
    );
    console.warn('   Use generateImageEmbedding(imageBuffer) for proper visual matching.');

    try {
      // Use Vertex AI Prediction API for text embeddings with REST
      const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      // Get access token from Google Auth
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/multimodalembedding@001:predict`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              text: text.substring(0, 1000),
            },
          ],
          parameters: {
            dimension: dimension,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as any;
      const prediction = data.predictions?.[0];

      if (!prediction || !prediction.textEmbedding) {
        throw new Error('No embedding returned from API');
      }

      const embedding = prediction.textEmbedding;

      // Validate and adjust dimensions
      if (embedding.length !== dimension) {
        if (embedding.length > dimension) {
          return embedding.slice(0, dimension);
        } else {
          return [...embedding, ...new Array(dimension - embedding.length).fill(0)];
        }
      }

      return embedding;
    } catch (error) {
      console.error('Google text embedding error:', error);
      throw new Error('Failed to generate text embedding with Google AI.');
    }
  }

  /**
   * Build prompt for policy generation
   */
  private buildPolicyPrompt(params: PolicyGenerationParams): string {
    const { serviceType, businessType, location } = params;

    const locationStr = `${location.city || ''}${location.state ? `, ${location.state}` : ''}, ${location.country}`;

    return `Generate professional business policies for a ${businessType || 'beauty services business'} in ${locationStr} that offers ${serviceType}.

Please create three separate policies:

1. CANCELLATION POLICY (2-3 sentences):
- Include the 24-hour cancellation notice requirement
- Mention that cancellations with less than 24 hours notice may result in charges
- Mention that appointments can be rescheduled with proper notice

2. LATE ARRIVAL POLICY (1-2 sentences):
- State that clients should arrive on time
- Mention a 15-minute grace period, after which the appointment may need to be rescheduled or shortened

3. REFUND POLICY (2-3 sentences):
- Explain the refund policy for late cancellations or no-shows
- Mention conditions under which refunds or credits may be issued
- State that full refunds are available if the provider cancels

Note: Make these policies general and professional. Specific deposit amounts and types are configured per-service.

Format your response as JSON:
{
  "cancellationPolicy": "...",
  "lateArrivalPolicy": "...",
  "refundPolicy": "..."
}`;
  }

  /**
   * Parse AI response into policy structure
   */
  private parsePolicyResponse(content: string): GeneratedPolicies {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const policies = JSON.parse(jsonMatch[0]) as GeneratedPolicies;

        if (policies.cancellationPolicy && policies.lateArrivalPolicy && policies.refundPolicy) {
          return policies;
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    throw new Error('Failed to parse AI-generated policies. Please try again.');
  }

  /**
   * Create searchable text from image analysis
   */
  createSearchableText(analysis: ImageAnalysis): string {
    const parts = [
      ...(analysis.tags || []),
      analysis.faceAttributes?.shape,
      analysis.faceAttributes?.skinTone,
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Match inspiration images with stylists
   *
   * ⚠️ DEPRECATED: This method is not used. Matching is handled in inspiration.controller.ts
   * Kept for backward compatibility only.
   */
  async matchInspiration(inspirationImageUrl: string): Promise<any[]> {
    console.warn(
      '⚠️  DEPRECATED: matchInspiration() is not used. Use inspiration.controller.ts instead.'
    );

    try {
      // Analyze the inspiration image
      const inspirationAnalysis = await this.analyzeImage(inspirationImageUrl);

      // Fetch image and generate proper image embedding
      const imageResponse = await fetch(inspirationImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Use IMAGE embedding, not text embedding
      const embedding = await this.generateImageEmbedding(imageBuffer);
      const searchText = this.createSearchableText(inspirationAnalysis);

      // Return analysis and embedding for matching
      return [
        {
          analysis: inspirationAnalysis,
          embedding: embedding,
          searchableText: searchText,
        },
      ];
    } catch (error) {
      console.error('Failed to match inspiration:', error);
      return [];
    }
  }

  /**
   * Extract style keywords from category using actual service templates
   * NOTE: SERVICE_CATEGORIES is not available in shared-constants
   * This function is currently disabled and returns empty array
   */
  private extractStyleKeywords(_category: string): string[] {
    // TODO: Re-implement when SERVICE_CATEGORIES is added to shared-constants
    return [];
  }


  /**
   * Generate rich domain-aware context for embedding fusion
   * Limited to 1024 characters for Vertex AI API
   */
  private generateEmbeddingContext(
    serviceTitle: string,
    serviceDescription: string,
    category: string,
    tags: string[],
    webLabels: string[],
    dominantColors?: string[]
  ): string {
    // Get category-specific guidelines (limited)
    const guidelines = this.getCategoryGuidelines(category).substring(0, 200);

    // Extract key style terms
    const styleKeywords = this.extractStyleKeywords(category);

    // Build comprehensive context with strict length limits
    const context = `
Service: ${serviceTitle.substring(0, 100)}
Description: ${serviceDescription.substring(0, 150)}
Category: ${category}
Style: ${styleKeywords.slice(0, 10).join(', ')}
Features: ${tags.slice(0, 15).join(', ')}
Context: ${webLabels.slice(0, 5).join(', ')}
Colors: ${dominantColors?.slice(0, 5).join(', ') || 'N/A'}
Guidelines: ${guidelines}
`.trim();

    // Ensure we never exceed 1024 characters
    return context.substring(0, 1000);
  }

  /**
   * Generate multiple specialized embeddings for comprehensive matching
   */
  async generateMultiVectorEmbeddings(
    imageSource: string | Buffer,
    analysisData: {
      tags: string[];
      description?: string;
      dominantColors?: string[];
      webLabels?: string[];
    },
    serviceContext: {
      title: string;
      description: string;
      category: string;
    }
  ): Promise<{
    visualOnly: number[];
    styleEnriched: number[];
  }> {
    // Generate 2 high-quality embeddings for comprehensive visual matching
    console.log('🎯 Generating high-quality visual embeddings (512-dim)...');

    // 1. Visual-Only Embedding (pure image, 512-dim)
    const visualOnly = await this.generateMultimodalEmbedding(imageSource);

    // 2. Style-Enriched Embedding (image + context, 512-dim) - PRIMARY
    const richContext = this.generateEmbeddingContext(
      serviceContext.title,
      serviceContext.description,
      serviceContext.category,
        analysisData.tags,
      analysisData.webLabels || [],
      analysisData.dominantColors
    );
    const styleEnriched = await this.generateMultimodalEmbedding(
      imageSource,
      richContext
    );

    if (!visualOnly || visualOnly.length === 0) {
      throw new Error('Failed to generate visual embedding');
    }

    if (!styleEnriched || styleEnriched.length === 0) {
      throw new Error('Failed to generate style-enriched embedding');
    }

    console.log('   ✅ Generated 2 high-quality embeddings:');
    console.log('      Visual-only: 512-dim (pure visual similarity)');
    console.log('      Style-enriched: 512-dim (context-aware, PRIMARY)');

    return {
      visualOnly,
      styleEnriched,
    };
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    service: string;
    initialized: boolean;
    features: {
      textGeneration: boolean;
      imageAnalysis: boolean;
      embeddings: boolean;
    };
  } {
    return {
      service: 'Google Cloud AI',
      initialized: this.isInitialized,
      features: {
        textGeneration: !!this.geminiModel,
        imageAnalysis: !!this.visionClient,
        embeddings: !!this.embeddingModel,
      },
    };
  }
}

export const aiService = new AIService();
