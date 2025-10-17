/**
 * AI Service using OpenAI
 * Provides AI-powered features across the platform
 */

import type { PolicyGenerationParams, GeneratedPolicies } from '../types/integration.types';

export class AIService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = 'gpt-4';

    if (!this.apiKey) {
      console.warn('OpenAI API key not configured. AI features will not work.');
    }
  }

  /**
   * Generate business policies using AI
   */
  async generatePolicies(params: PolicyGenerationParams): Promise<GeneratedPolicies> {
    // Require API key - no fallback
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.'
      );
    }

    const prompt = this.buildPolicyPrompt(params);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
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

    // Parse the AI response
    return this.parsePolicyResponse(content);
  }

  /**
   * Build prompt for policy generation
   */
  private buildPolicyPrompt(params: PolicyGenerationParams): string {
    const { businessName, businessType, serviceTypes, depositType, depositAmount } = params;

    const depositText =
      depositType === 'percentage' ? `${depositAmount}% of the service price` : `$${depositAmount}`;

    return `Generate professional business policies for "${businessName}", a ${businessType || 'beauty services business'} that offers ${serviceTypes.join(', ')}.

The business requires a ${depositText} deposit for all bookings.

Please create three separate policies:

1. CANCELLATION POLICY (2-3 sentences):
- Include the 24-hour cancellation notice requirement
- Mention that cancellations with less than 24 hours notice result in a 50% charge
- Mention that deposits can be applied to rescheduled appointments with proper notice

2. LATE ARRIVAL POLICY (1-2 sentences):
- State that clients should arrive on time
- Mention a 15-minute grace period, after which the appointment may need to be rescheduled

3. REFUND POLICY (2-3 sentences):
- Explain that deposits are non-refundable for late cancellations or no-shows
- Mention that deposits can be transferred to future appointments with proper notice
- State that full refunds are available only if the provider cancels

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
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const policies = JSON.parse(jsonMatch[0]) as GeneratedPolicies;

        // Validate that all required fields exist
        if (policies.cancellationPolicy && policies.lateArrivalPolicy && policies.refundPolicy) {
          return policies;
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    // If parsing fails, throw error instead of using fallback
    throw new Error('Failed to parse AI-generated policies. Please try again.');
  }

  /**
   * Generate service description
   */
  async generateServiceDescription(
    title: string,
    category: string,
    businessName?: string
  ): Promise<string> {
    // Require API key - no fallback
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.'
      );
    }

    const prompt = `Write a professional, engaging service description for "${title}" in the ${category} category${businessName ? ` at ${businessName}` : ''}. 

The description should:
- Be 2-3 sentences long
- Highlight the benefits for the client
- Sound professional but friendly
- Focus on quality and results
- Be in first person ("I" or "We")

Do not include pricing or duration information.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional copywriter specializing in beauty service descriptions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      await response.json().catch(() => ({})); // Consume response
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Failed to generate service description - empty response from AI');
    }

    return content;
  }

  /**
   * Analyze image (placeholder for future implementation)
   */
  async analyzeImage(imageUrl: string): Promise<unknown> {
    console.log(`Analyzing image: ${imageUrl}`);
    return {};
  }

  /**
   * Match inspiration (placeholder for future implementation)
   */
  async matchInspiration(inspirationImageUrl: string): Promise<unknown[]> {
    console.log(`Matching inspiration: ${inspirationImageUrl}`);
    return [];
  }
}

export const aiService = new AIService();
