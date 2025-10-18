import { VertexAI } from '@google-cloud/vertexai';
import vision from '@google-cloud/vision';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import type {
  PolicyGenerationParams,
  GeneratedPolicies,
  GoogleCloudConfig,
  VisionAnalysisResult,
} from '../types/integration.types';

export class GoogleCloudService {
  private vertexAI: VertexAI;
  private visionClient: ImageAnnotatorClient;
  private config: GoogleCloudConfig;

  constructor(config: GoogleCloudConfig) {
    this.config = config;

    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: config.projectId,
      location: config.location,
      ...(config.credentials && { credentials: config.credentials }),
    });

    // Initialize Vision API
    this.visionClient = new vision.ImageAnnotatorClient({
      projectId: config.projectId,
      ...(config.credentials && { credentials: config.credentials }),
    });
  }

  /**
   * Generate business policies using Vertex AI
   */
  async generatePolicies(params: PolicyGenerationParams): Promise<GeneratedPolicies> {
    const model = this.vertexAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
Generate comprehensive business policies for a ${params.businessType} in ${params.location.city}, ${params.location.state || params.location.country}.

Service Type: ${params.serviceType}
Business Type: ${params.businessType}
Location: ${params.location.city}, ${params.location.state || params.location.country}
${params.customRequirements ? `Custom Requirements: ${params.customRequirements.join(', ')}` : ''}

Generate policies for:
1. Cancellation Policy
2. Rescheduling Policy  
3. Refund Policy
4. No-Show Policy
5. Late Arrival Policy
6. Deposit Policy
7. Health & Safety Policy
8. Service Modification Policy

Return as JSON with this exact structure:
{
  "cancellationPolicy": {
    "title": "Cancellation Policy",
    "description": "...",
    "rules": ["rule1", "rule2"],
    "timeframes": {
      "freeCancellation": "24 hours",
      "partialRefund": "12 hours", 
      "noRefund": "2 hours"
    }
  },
  "reschedulingPolicy": { ... },
  "refundPolicy": { ... },
  "noShowPolicy": { ... },
  "lateArrivalPolicy": { ... },
  "depositPolicy": { ... },
  "healthAndSafetyPolicy": { ... },
  "serviceModificationPolicy": { ... }
}
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse policy generation response');
      }

      return JSON.parse(jsonMatch[0]) as GeneratedPolicies;
    } catch (error) {
      console.error('Error generating policies:', error);
      throw new Error('Failed to generate business policies');
    }
  }

  /**
   * Analyze image using Google Vision API
   */
  async analyzeImage(imageUrl: string): Promise<VisionAnalysisResult> {
    try {
      const [labelResult] = await this.visionClient.labelDetection(imageUrl);
      const [faceResult] = await this.visionClient.faceDetection(imageUrl);
      const [colorResult] = await this.visionClient.imageProperties(imageUrl);
      const [textResult] = await this.visionClient.textDetection(imageUrl);
      const [landmarkResult] = await this.visionClient.landmarkDetection(imageUrl);

      return {
        labels:
          labelResult.labelAnnotations?.map((label) => ({
            description: label.description || '',
            score: label.score || 0,
          })) || [],
        faces:
          faceResult.faceAnnotations?.map((face) => ({
            joy:
              face.joyLikelihood === 'VERY_LIKELY'
                ? 1
                : face.joyLikelihood === 'LIKELY'
                  ? 0.8
                  : face.joyLikelihood === 'POSSIBLE'
                    ? 0.5
                    : 0,
            sorrow:
              face.sorrowLikelihood === 'VERY_LIKELY'
                ? 1
                : face.sorrowLikelihood === 'LIKELY'
                  ? 0.8
                  : face.sorrowLikelihood === 'POSSIBLE'
                    ? 0.5
                    : 0,
            anger:
              face.angerLikelihood === 'VERY_LIKELY'
                ? 1
                : face.angerLikelihood === 'LIKELY'
                  ? 0.8
                  : face.angerLikelihood === 'POSSIBLE'
                    ? 0.5
                    : 0,
            surprise:
              face.surpriseLikelihood === 'VERY_LIKELY'
                ? 1
                : face.surpriseLikelihood === 'LIKELY'
                  ? 0.8
                  : face.surpriseLikelihood === 'POSSIBLE'
                    ? 0.5
                    : 0,
          })) || [],
        colors:
          colorResult.imagePropertiesAnnotation?.dominantColors?.colors?.map((color) => ({
            color: {
              red: color.color?.red || 0,
              green: color.color?.green || 0,
              blue: color.color?.blue || 0,
            },
            score: color.score || 0,
            pixelFraction: color.pixelFraction || 0,
          })) || [],
        text: textResult.textAnnotations?.[0]?.description || '',
        landmarks:
          landmarkResult.landmarkAnnotations?.map((landmark) => ({
            description: landmark.description || '',
            location: {
              lat: landmark.locations?.[0]?.latLng?.latitude || 0,
              lng: landmark.locations?.[0]?.latLng?.longitude || 0,
            },
          })) || [],
      };
    } catch (error) {
      console.error('Error analyzing image with Vision API:', error);
      throw new Error('Failed to analyze image');
    }
  }

  /**
   * Generate content using Vertex AI
   */
  async generateContent(prompt: string, modelName: string = 'gemini-1.5-pro'): Promise<string> {
    const generativeModel = this.vertexAI.getGenerativeModel({ model: modelName });

    try {
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Get model information
   */
  getModelInfo(modelName: string = 'gemini-1.5-pro') {
    return {
      name: modelName,
      project: this.config.projectId,
      location: this.config.location,
    };
  }
}

// Export singleton instance
export const googleCloudService = new GoogleCloudService({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  credentials: process.env.GOOGLE_CLOUD_CREDENTIALS
    ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    : undefined,
});
