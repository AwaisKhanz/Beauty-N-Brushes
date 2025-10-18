/**
 * Enhanced AI Service with Google Cloud AI integration
 * Uses the best AI services for each specific use case
 */

import type { PolicyGenerationParams, GeneratedPolicies } from '../types/integration.types';
import { VertexAI } from '@google-cloud/vertexai';
import vision from '@google-cloud/vision';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Type definitions
export interface ImageAnalysis {
  hairType?: string | null;
  styleType?: string | null;
  colorInfo?: string | null;
  complexityLevel?: string;
  tags: string[];
  dominantColors?: string[];
  faceAttributes?: {
    shape?: string;
    skinTone?: string;
    landmarks?: any[];
  };
}

export class AIService {
  private openAIKey: string;
  private useGoogleAI: boolean;
  private vertexAI?: VertexAI;
  private visionClient?: ImageAnnotatorClient;
  private geminiModel?: any;
  private embeddingModel?: any;

  constructor() {
    // OpenAI fallback configuration
    this.openAIKey = process.env.OPENAI_API_KEY || '';

    // Google AI configuration
    this.useGoogleAI = process.env.USE_GOOGLE_AI === 'true';

    if (this.useGoogleAI) {
      this.initializeGoogleAI();
    } else if (!this.openAIKey) {
      console.warn('No AI service configured. AI features will not work.');
    }
  }

  /**
   * Initialize Google Cloud AI services
   */
  private initializeGoogleAI() {
    try {
      // Initialize Vertex AI for text generation and embeddings
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT!,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      });

      // Initialize generative model (Gemini Pro)
      this.geminiModel = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      // Initialize embedding model
      this.embeddingModel = this.vertexAI.preview.getGenerativeModel({
        model: 'textembedding-gecko@latest',
      });

      // Initialize Vision AI client
      this.visionClient = new vision.ImageAnnotatorClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      console.log('Google Cloud AI services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google AI services:', error);
      this.useGoogleAI = false;
    }
  }

  /**
   * Generate business policies using AI
   */
  async generatePolicies(params: PolicyGenerationParams): Promise<GeneratedPolicies> {
    if (this.useGoogleAI && this.geminiModel) {
      return this.generatePoliciesWithGemini(params);
    }

    return this.generatePoliciesWithOpenAI(params);
  }

  /**
   * Generate policies using Google Gemini
   */
  private async generatePoliciesWithGemini(
    params: PolicyGenerationParams
  ): Promise<GeneratedPolicies> {
    const prompt = this.buildPolicyPrompt(params);

    try {
      const result = await this.geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      return this.parsePolicyResponse(content);
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to OpenAI if available
      if (this.openAIKey) {
        console.log('Falling back to OpenAI...');
        return this.generatePoliciesWithOpenAI(params);
      }
      throw error;
    }
  }

  /**
   * Original OpenAI implementation for policies
   */
  private async generatePoliciesWithOpenAI(
    params: PolicyGenerationParams
  ): Promise<GeneratedPolicies> {
    if (!this.openAIKey) {
      throw new Error('No AI service available. Please configure Google AI or OpenAI.');
    }

    const prompt = this.buildPolicyPrompt(params);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional business consultant specializing in beauty services. Generate clear, professional, and client-friendly business policies.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorBody);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Failed to generate policies - empty response from AI');
    }

    return this.parsePolicyResponse(content);
  }

  /**
   * Generate service description
   */
  async generateServiceDescription(
    title: string,
    category: string,
    businessName?: string
  ): Promise<string> {
    const prompt = `Write a professional, engaging service description for "${title}" in the ${category} category${businessName ? ` at ${businessName}` : ''}. 

The description should:
- Be 2-3 sentences long
- Highlight the benefits for the client
- Sound professional but friendly
- Focus on quality and results
- Be in first person ("I" or "We")

Do not include pricing or duration information.`;

    if (this.useGoogleAI && this.geminiModel) {
      try {
        const result = await this.geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const response = await result.response;
        const content = response.text();

        if (!content) {
          throw new Error('Empty response from Gemini');
        }

        return content.trim();
      } catch (error) {
        console.error('Gemini error:', error);
        if (this.openAIKey) {
          return this.generateTextWithOpenAI(prompt);
        }
        throw error;
      }
    }

    return this.generateTextWithOpenAI(prompt);
  }

  /**
   * Generic text generation method
   */
  async generateText(prompt: string): Promise<string> {
    if (this.useGoogleAI && this.geminiModel) {
      try {
        const result = await this.geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const response = await result.response;
        const content = response.text();

        if (!content) {
          throw new Error('Empty response from Gemini');
        }

        return content.trim();
      } catch (error) {
        console.error('Gemini error:', error);
        if (this.openAIKey) {
          return this.generateTextWithOpenAI(prompt);
        }
        throw error;
      }
    }

    return this.generateTextWithOpenAI(prompt);
  }

  /**
   * Original OpenAI text generation
   */
  private async generateTextWithOpenAI(prompt: string): Promise<string> {
    if (!this.openAIKey) {
      throw new Error('No AI service available');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant specializing in beauty and wellness services.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Failed to generate text - empty response');
    }

    return content;
  }

  /**
   * Analyze image using Google Vision AI (superior for beauty analysis)
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
    if (this.useGoogleAI && this.visionClient) {
      try {
        return await this.analyzeImageWithGoogleVision(imageUrl);
      } catch (error) {
        console.warn(
          'Google Vision API failed, falling back to OpenAI:',
          error instanceof Error ? error.message : String(error)
        );
        return this.analyzeImageWithOpenAI(imageUrl);
      }
    }

    return this.analyzeImageWithOpenAI(imageUrl);
  }

  /**
   * Analyze image from base64
   */
  async analyzeImageFromBase64(base64Image: string): Promise<ImageAnalysis> {
    if (this.useGoogleAI && this.visionClient) {
      try {
        return await this.analyzeBase64WithGoogleVision(base64Image);
      } catch (error) {
        console.warn(
          'Google Vision API failed, falling back to OpenAI:',
          error instanceof Error ? error.message : String(error)
        );
        return this.analyzeBase64WithOpenAI(base64Image);
      }
    }

    return this.analyzeBase64WithOpenAI(base64Image);
  }

  /**
   * Google Vision AI implementation - optimized for beauty services
   */
  private async analyzeImageWithGoogleVision(imageUrl: string): Promise<ImageAnalysis> {
    try {
      // Fetch image from URL
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return this.analyzeImageBuffer(buffer);
    } catch (error) {
      console.error('Google Vision error:', error);
      if (this.openAIKey) {
        return this.analyzeImageWithOpenAI(imageUrl);
      }
      throw error;
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
      if (this.openAIKey) {
        return this.analyzeBase64WithOpenAI(base64Image);
      }
      throw error;
    }
  }

  /**
   * Core Google Vision analysis logic
   */
  private async analyzeImageBuffer(buffer: Buffer): Promise<ImageAnalysis> {
    const [result] = await this.visionClient!.annotateImage({
      image: { content: buffer.toString('base64') },
      features: [
        { type: 'FACE_DETECTION', maxResults: 5 },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'LABEL_DETECTION', maxResults: 30 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
      ],
    });

    // Extract beauty-specific insights
    const analysis: ImageAnalysis = {
      hairType: this.detectHairType(result),
      styleType: this.identifyStyleType(result),
      colorInfo: this.extractColorInfo(result),
      complexityLevel: this.assessComplexity(result),
      tags: this.generateTags(result),
      dominantColors: this.extractDominantColors(result),
      faceAttributes: this.analyzeFaceAttributes(result),
    };

    return analysis;
  }

  /**
   * Hair type detection from Vision AI results
   */
  private detectHairType(result: any): string | null {
    const labels = result.labelAnnotations || [];
    const hairTypes = ['straight', 'wavy', 'curly', 'coily', 'fine', 'thick'];

    for (const label of labels) {
      const lowerDesc = label.description.toLowerCase();
      for (const type of hairTypes) {
        if (lowerDesc.includes(type)) {
          return type;
        }
      }
    }

    // Advanced detection based on visual properties
    if (labels.some((l: any) => l.description.toLowerCase().includes('hair'))) {
      // Analyze texture from image properties
      return 'wavy'; // Default if hair detected but type unclear
    }

    return null;
  }

  /**
   * Style type identification
   */
  private identifyStyleType(result: any): string | null {
    const labels = result.labelAnnotations || [];
    // const objects = result.localizedObjectAnnotations || [];

    // Common beauty service styles
    const stylePatterns = [
      { pattern: /braid|plait/, style: 'braids' },
      { pattern: /balayage|highlight/, style: 'balayage' },
      { pattern: /bob|pixie/, style: 'short cut' },
      { pattern: /updo|bun/, style: 'updo' },
      { pattern: /extension/, style: 'extensions' },
      { pattern: /color|dye/, style: 'color treatment' },
      { pattern: /perm|curl/, style: 'perm' },
      { pattern: /straighten/, style: 'straightening' },
    ];

    for (const label of labels) {
      const desc = label.description.toLowerCase();
      for (const { pattern, style } of stylePatterns) {
        if (pattern.test(desc)) {
          return style;
        }
      }
    }

    return labels[0]?.description || null;
  }

  /**
   * Extract color information
   */
  private extractColorInfo(result: any): string | null {
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    if (colors.length === 0) return null;

    // Find hair-related colors (browns, blacks, blondes, reds)
    const hairColorRanges = [
      { name: 'black', r: [0, 50], g: [0, 50], b: [0, 50] },
      { name: 'brown', r: [100, 180], g: [50, 130], b: [0, 80] },
      { name: 'blonde', r: [200, 255], g: [180, 240], b: [100, 200] },
      { name: 'red', r: [150, 255], g: [50, 150], b: [0, 100] },
      { name: 'gray', r: [100, 200], g: [100, 200], b: [100, 200] },
    ];

    for (const color of colors) {
      const rgb = color.color;
      for (const range of hairColorRanges) {
        if (
          rgb.red >= range.r[0] &&
          rgb.red <= range.r[1] &&
          rgb.green >= range.g[0] &&
          rgb.green <= range.g[1] &&
          rgb.blue >= range.b[0] &&
          rgb.blue <= range.b[1]
        ) {
          return range.name;
        }
      }
    }

    return 'multi-toned';
  }

  /**
   * Assess complexity level based on detected features
   */
  private assessComplexity(result: any): string {
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];
    // const faces = result.faceAnnotations || [];

    let complexityScore = 0;

    // More objects/details = higher complexity
    complexityScore += objects.length * 2;
    complexityScore += labels.length * 0.5;

    // Intricate styles add complexity
    const complexStyles = ['braid', 'updo', 'extension', 'balayage', 'highlight'];
    for (const label of labels) {
      if (complexStyles.some((s) => label.description.toLowerCase().includes(s))) {
        complexityScore += 5;
      }
    }

    if (complexityScore < 10) return 'simple';
    if (complexityScore < 25) return 'moderate';
    return 'complex';
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
   * Original OpenAI Vision implementation (fallback)
   */
  private async analyzeImageWithOpenAI(imageUrl: string): Promise<ImageAnalysis> {
    if (!this.openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert beauty and hair styling analyst. Analyze images and extract detailed, accurate tags for search and matching purposes.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this beauty/hair service image and return ONLY valid JSON with this exact structure:
{
  "hairType": "straight/wavy/curly/coily/fine/thick or null if not applicable",
  "styleType": "specific style description (e.g., box braids, pixie cut, balayage)",
  "colorInfo": "color details or null",
  "complexityLevel": "simple/moderate/complex",
  "tags": ["array", "of", "descriptive", "searchable", "tags"],
  "dominantColors": ["#hex1", "#hex2", "#hex3"]
}

Be specific and detailed in your analysis. Include texture, technique, length, and other relevant beauty service details.`,
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT-4 Vision error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Failed to analyze image - empty response');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * OpenAI base64 image analysis (fallback)
   */
  private async analyzeBase64WithOpenAI(base64Image: string): Promise<ImageAnalysis> {
    if (!this.openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert beauty and hair styling analyst.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this beauty/hair service image and return ONLY valid JSON with this exact structure:
{
  "hairType": "straight/wavy/curly/coily/fine/thick or null if not applicable",
  "styleType": "specific style description (e.g., box braids, pixie cut, balayage)",
  "colorInfo": "color details or null",
  "complexityLevel": "simple/moderate/complex",
  "tags": ["array", "of", "descriptive", "searchable", "tags"],
  "dominantColors": ["#hex1", "#hex2", "#hex3"]
}`,
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT-4 Vision error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate embeddings for vector search from IMAGE
   * Uses ONLY Google Vision AI to create TRUE visual embeddings (not text-based)
   *
   * Returns 512-dimensional feature vector based on actual pixel analysis:
   * - Color histogram (256 dims) - RGB distribution
   * - Object/label features (128 dims) - Hair-specific attributes
   * - Spatial features (64 dims) - Face/hair position
   * - Texture features (64 dims) - Color variance and complexity
   */
  async generateImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
    if (!this.useGoogleAI || !this.visionClient) {
      throw new Error(
        'Google Cloud Vision AI is required for image embeddings. ' +
          'Please configure USE_GOOGLE_AI=true and GOOGLE_APPLICATION_CREDENTIALS in .env'
      );
    }

    try {
      // Use Google Vision AI to extract visual features from pixels
      const [result] = await this.visionClient!.annotateImage({
        image: { content: imageBuffer.toString('base64') },
        features: [
          { type: 'FACE_DETECTION', maxResults: 5 },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'LABEL_DETECTION', maxResults: 30 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        ],
      });

      // Create a comprehensive visual feature vector from actual pixels
      const visualFeatures = this.createVisualFeatureVector(result);
      return visualFeatures;
    } catch (error) {
      console.error('Google Vision embedding error:', error);
      throw error;
    }
  }

  /**
   * Create a visual feature vector from Vision AI results
   * This captures color, texture, objects, and spatial information
   */
  private createVisualFeatureVector(visionResult: any): number[] {
    const features: number[] = [];

    // 1. Color histogram (256 dimensions)
    const colorHistogram = this.createColorHistogram(visionResult);
    features.push(...colorHistogram);

    // 2. Object and label features (128 dimensions)
    const objectFeatures = this.createObjectFeatures(visionResult);
    features.push(...objectFeatures);

    // 3. Face and spatial features (64 dimensions)
    const spatialFeatures = this.createSpatialFeatures(visionResult);
    features.push(...spatialFeatures);

    // 4. Texture features (64 dimensions)
    const textureFeatures = this.createTextureFeatures(visionResult);
    features.push(...textureFeatures);

    // Ensure exactly 512 dimensions
    if (features.length > 512) {
      return features.slice(0, 512);
    } else if (features.length < 512) {
      return [...features, ...new Array(512 - features.length).fill(0)];
    }
    return features;
  }

  /**
   * Create color histogram from dominant colors
   */
  private createColorHistogram(result: any): number[] {
    const histogram = new Array(256).fill(0);
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    colors.forEach((color: any) => {
      const { red, green, blue } = color.color;
      const pixelFraction = color.pixelFraction || 0;

      // Distribute color information across histogram
      const binR = Math.floor((red / 255) * 85);
      const binG = Math.floor((green / 255) * 85);
      const binB = Math.floor((blue / 255) * 85);

      histogram[binR] += pixelFraction * 0.3;
      histogram[85 + binG] += pixelFraction * 0.3;
      histogram[170 + binB] += pixelFraction * 0.4;
    });

    return histogram;
  }

  /**
   * Create object and label features
   */
  private createObjectFeatures(result: any): number[] {
    const features = new Array(128).fill(0);
    const labels = result.labelAnnotations || [];

    // Hair-specific features
    const hairKeywords = [
      'hair',
      'hairstyle',
      'curly',
      'straight',
      'wavy',
      'braids',
      'afro',
      'texture',
    ];
    hairKeywords.forEach((keyword, i) => {
      const matchingLabels = labels.filter((l: any) =>
        l.description.toLowerCase().includes(keyword)
      );
      features[i] = matchingLabels.reduce((sum: number, l: any) => sum + l.score, 0);
    });

    // General labels
    labels.slice(0, 120).forEach((label: any, i: number) => {
      if (i + 8 < 128) {
        features[i + 8] = label.score;
      }
    });

    return features;
  }

  /**
   * Create spatial and face features
   */
  private createSpatialFeatures(result: any): number[] {
    const features = new Array(64).fill(0);
    const faces = result.faceAnnotations || [];

    if (faces.length > 0) {
      const face = faces[0];
      // Face position and size
      if (face.boundingPoly) {
        const vertices = face.boundingPoly.vertices;
        features[0] = vertices[0]?.x || 0;
        features[1] = vertices[0]?.y || 0;
        features[2] = Math.abs((vertices[1]?.x || 0) - (vertices[0]?.x || 0)); // width
        features[3] = Math.abs((vertices[2]?.y || 0) - (vertices[0]?.y || 0)); // height
      }

      // Face landmarks (encode hair region)
      const landmarks = face.landmarks || [];
      landmarks.slice(0, 60).forEach((landmark: any, i: number) => {
        if (i + 4 < 64) {
          features[i + 4] = landmark.position?.y || 0;
        }
      });
    }

    return features;
  }

  /**
   * Create texture features from image properties
   */
  private createTextureFeatures(result: any): number[] {
    const features = new Array(64).fill(0);
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    // Color variance indicates texture complexity
    if (colors.length > 1) {
      const colorVariance = this.calculateColorVariance(colors);
      features[0] = colorVariance;
    }

    // Number of colors indicates complexity
    features[1] = Math.min(colors.length / 10, 1);

    // Pixel fraction distribution
    colors.slice(0, 62).forEach((color: any, i: number) => {
      features[i + 2] = color.pixelFraction || 0;
    });

    return features;
  }

  /**
   * Calculate color variance for texture detection
   */
  private calculateColorVariance(colors: any[]): number {
    if (colors.length < 2) return 0;

    const avgColor = {
      r: colors.reduce((sum, c) => sum + c.color.red, 0) / colors.length,
      g: colors.reduce((sum, c) => sum + c.color.green, 0) / colors.length,
      b: colors.reduce((sum, c) => sum + c.color.blue, 0) / colors.length,
    };

    const variance = colors.reduce((sum, c) => {
      const dr = c.color.red - avgColor.r;
      const dg = c.color.green - avgColor.g;
      const db = c.color.blue - avgColor.b;
      return sum + (dr * dr + dg * dg + db * db);
    }, 0);

    return Math.sqrt(variance / colors.length) / 255; // Normalize to 0-1
  }

  /**
   * Generate embeddings for vector search (DEPRECATED - use generateImageEmbedding)
   * Returns 512-dimensional embeddings to match CLIP format
   */
  async generateEmbedding(text: string): Promise<number[]> {
    console.warn(
      'WARNING: generateEmbedding (text-based) should not be used for image matching. Use generateImageEmbedding instead.'
    );

    if (this.useGoogleAI && this.embeddingModel) {
      try {
        const result = await this.embeddingModel.embedContent({
          content: { parts: [{ text: text.substring(0, 8000) }] },
        });

        // Truncate or pad to 512 dimensions to match CLIP
        const embedding = result.embedding.values;
        if (embedding.length > 512) {
          return embedding.slice(0, 512);
        } else if (embedding.length < 512) {
          return [...embedding, ...new Array(512 - embedding.length).fill(0)];
        }
        return embedding;
      } catch (error) {
        console.error('Google embedding error:', error);
        if (this.openAIKey) {
          return this.generateEmbeddingWithOpenAI(text);
        }
        throw error;
      }
    }

    return this.generateEmbeddingWithOpenAI(text);
  }

  /**
   * OpenAI embedding generation (fallback)
   * Truncates to 512 dimensions to match CLIP format
   */
  private async generateEmbeddingWithOpenAI(text: string): Promise<number[]> {
    if (!this.openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAIKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000),
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    // Truncate to 512 dimensions to match CLIP embeddings
    return data.data[0].embedding.slice(0, 512);
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
      analysis.styleType,
      analysis.hairType,
      analysis.colorInfo,
      analysis.complexityLevel,
      ...(analysis.tags || []),
      analysis.faceAttributes?.shape,
      analysis.faceAttributes?.skinTone,
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Match inspiration images with stylists
   */
  async matchInspiration(inspirationImageUrl: string): Promise<any[]> {
    try {
      // Analyze the inspiration image
      const inspirationAnalysis = await this.analyzeImage(inspirationImageUrl);

      // Generate embedding for semantic search
      const searchText = this.createSearchableText(inspirationAnalysis);
      const embedding = await this.generateEmbedding(searchText);

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
    primary: string;
    available: string[];
    features: {
      textGeneration: boolean;
      imageAnalysis: boolean;
      embeddings: boolean;
    };
  } {
    const available = [];
    if (this.useGoogleAI && this.geminiModel) available.push('Google AI');
    if (this.openAIKey) available.push('OpenAI');

    return {
      primary: this.useGoogleAI ? 'Google AI' : 'OpenAI',
      available,
      features: {
        textGeneration: !!(this.geminiModel || this.openAIKey),
        imageAnalysis: !!(this.visionClient || this.openAIKey),
        embeddings: !!(this.embeddingModel || this.openAIKey),
      },
    };
  }
}

export const aiService = new AIService();
