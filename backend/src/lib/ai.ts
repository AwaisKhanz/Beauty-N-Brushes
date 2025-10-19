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
      // Using 1408 (max) for maximum expressiveness - captures fine details
      // in textures, colors, lighting, and subtle style differences
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

    const text = candidate.content.parts[0].text;
    if (!text) {
      throw new Error('No text in Gemini response');
    }

    return text;
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
   * Analyze image from base64
   */
  async analyzeImageFromBase64(base64Image: string): Promise<ImageAnalysis> {
    this.ensureInitialized();
    return await this.analyzeBase64WithGoogleVision(base64Image);
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
  private async analyzeBase64WithGoogleVision(base64Image: string): Promise<ImageAnalysis> {
    try {
      const buffer = Buffer.from(base64Image, 'base64');
      return this.analyzeImageBuffer(buffer);
    } catch (error) {
      console.error('Google Vision error:', error);
      throw new Error('Failed to analyze image with Google Vision AI.');
    }
  }

  /**
   * Core Google Vision analysis logic - Enhanced with Gemini Vision
   */
  private async analyzeImageBuffer(buffer: Buffer): Promise<ImageAnalysis> {
    // Run both Vision AI (for basic features) and Gemini Vision (for detailed hairstyle analysis) in parallel
    const [visionResult, geminiAnalysis] = await Promise.all([
      // Vision AI for basic object detection and colors
      this.visionClient.annotateImage({
        image: { content: buffer.toString('base64') },
        features: [
          { type: 'FACE_DETECTION', maxResults: 5 },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'LABEL_DETECTION', maxResults: 30 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        ],
      }),
      // Gemini Vision for detailed hairstyle analysis
      this.analyzeHairstyleWithGemini(buffer),
    ]);

    const result = visionResult[0];

    // Debug: Log what Vision AI detected
    console.log('\n🔍 Vision AI Basic Detection:');
    console.log(
      '   Labels:',
      (result.labelAnnotations || []).slice(0, 10).map((l: any) => l.description)
    );
    console.log(
      '   Objects:',
      (result.localizedObjectAnnotations || []).map((o: any) => o.name)
    );

    // Debug: Log Gemini's detailed analysis
    console.log('\n✨ Gemini Vision Hairstyle Analysis:');
    console.log('   Tags:', geminiAnalysis.tags.slice(0, 8).join(', '));

    // Combine Vision AI color detection with Gemini's hairstyle expertise
    const dominantColors = this.extractDominantColors(result);
    const faceAttributes = this.analyzeFaceAttributes(result);

    // Merge tags from both sources (Gemini tags are more detailed)
    const visionTags = this.generateTags(result);
    const allTags = [...new Set([...geminiAnalysis.tags, ...visionTags])];

    const analysis: ImageAnalysis = {
      tags: allTags, // Combined tags
      dominantColors: dominantColors, // Use Vision AI's color detection
      faceAttributes: faceAttributes, // Use Vision AI's face detection
    };

    console.log('\n   ✅ Final Analysis:', {
      totalTags: analysis.tags.length,
    });

    return analysis;
  }

  /**
   * Analyze hairstyle using Gemini Vision (multimodal AI)
   * This provides much better hairstyle-specific analysis than generic Vision AI
   */
  private async analyzeHairstyleWithGemini(imageBuffer: Buffer): Promise<{
    tags: string[];
  }> {
    try {
      const base64Image = imageBuffer.toString('base64');

      const prompt = `Analyze this hairstyle/beauty image in detail.

Generate 15-20 specific searchable keywords that describe:
- Hair texture (e.g., "curly", "textured", "smooth", "voluminous", "coily", "kinky")
- Hair type (e.g., "straight", "wavy", "curly")
- Cut/style (e.g., "fade", "undercut", "layers", "blunt-cut", "bob", "pixie", "braids", "locs", "afro")
- Length (e.g., "short", "medium", "long", "shoulder-length")
- Styling (e.g., "defined-curls", "slicked-back", "messy", "sleek", "updo", "ponytail")
- Features (e.g., "volume", "shine", "natural", "styled", "groomed")
- Colors/tones (e.g., "black", "brown", "blonde", "warm-tones", "cool-tones", "highlights", "balayage", "ombre")
- Complexity (e.g., "simple", "moderate", "complex")
- Service type (e.g., "haircut", "color-treatment", "styling", "braiding", "mens-haircut", "womens-haircut")

Format your response EXACTLY as JSON:
{
  "tags": ["curly", "fade", "mens-haircut", "textured", "defined-curls", "short-sides", "volume-top", "brown-hair", "warm-tones", "modern-style", "styled", "groomed", "professional", "barbering", "curly-hair-specialist"]
}

IMPORTANT:
- Be specific about the hairstyle, not just "person" or "face"
- Focus on beauty/hair service keywords that clients would search for
- Include both technical terms and common search terms
- Respond ONLY with valid JSON, no other text`;

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
      });

      const response = result.response;
      const content = this.extractTextFromResponse(response);

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini Vision');
      }

      const geminiResult = JSON.parse(jsonMatch[0]);

      return {
        tags: Array.isArray(geminiResult.tags) ? geminiResult.tags : [],
      };
    } catch (error) {
      console.error('⚠️  Gemini Vision analysis failed, using fallback:', error);
      // Fallback to basic analysis if Gemini fails
      return {
        tags: ['hairstyle', 'beauty-service'],
      };
    }
  }

  /**
   * Generate comprehensive tags for search
   */
  private generateTags(result: any): string[] {
    const tags = new Set<string>();

    // Add label annotations
    const labels = result.labelAnnotations || [];
    labels.forEach((label: any) => {
      if (label.score > 0.7) {
        tags.add(label.description.toLowerCase());
      }
    });

    // Add object annotations
    const objects = result.localizedObjectAnnotations || [];
    objects.forEach((obj: any) => {
      tags.add(obj.name.toLowerCase());
    });

    // Add beauty-specific tags based on detection
    if (result.faceAnnotations?.length > 0) {
      tags.add('portrait');
      tags.add('face');
    }

    return Array.from(tags);
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
   * Generate MULTIMODAL embedding (Image + Text fusion)
   * Combines visual and textual information for better matching
   *
   * @param imageBuffer Raw image buffer
   * @param text Contextual text (e.g., "Curly fade haircut", "Balayage blonde")
   * @param dimension Embedding dimension (default: 1408)
   * @returns Fused embedding vector
   */
  async generateMultimodalEmbedding(
    imageBuffer: Buffer,
    text: string,
    dimension: 128 | 256 | 512 | 1408 = 1408
  ): Promise<number[]> {
    this.ensureInitialized();

    return this.retryWithBackoff(async () => {
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

      const requestBody = {
        instances: [
          {
            image: {
              bytesBase64Encoded: base64Image,
            },
            text: text, // Include text for multimodal fusion
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
        `✅ Generated ${dimension}-dim MULTIMODAL embedding (image+text fusion) using multimodalembedding@001`
      );
      console.log(`   Text context: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
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
  async generateEmbedding(
    text: string,
    dimension: 128 | 256 | 512 | 1408 = 512
  ): Promise<number[]> {
    this.ensureInitialized();

    console.warn(
      '⚠️  WARNING: Using text-based embeddings for image matching reduces accuracy by 50-70%.'
    );
    console.warn('   Use generateImageEmbedding(imageBuffer) for proper visual matching.');

    try {
      // Use multimodal embedding model for text (same semantic space as images)
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: text.substring(0, 8000) }],
          },
        ],
      };

      const params: any = {};
      if (dimension !== 1408) {
        params.dimension = dimension;
      }

      const result = await this.embeddingModel.embedContent({
        ...request,
        ...params,
      });

      const embedding = result.embedding.values;

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
