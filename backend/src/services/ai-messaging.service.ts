/**
 * AI Messaging Service
 * Handles AI-powered message draft generation and chatbot responses
 */

import { prisma } from '../config/database';
import { aiService } from '../lib/ai';

export interface MessageDraftParams {
  providerId: string;
  clientMessage: string;
  conversationId?: string;
}

export interface ChatbotQueryParams {
  context: 'homepage' | 'provider_profile';
  query: string;
  providerId?: string;
}

export class AIMessagingService {
  /**
   * Generate AI draft reply for provider based on context
   */
  async generateDraftReply(params: MessageDraftParams): Promise<{
    draft: string;
    confidence: number;
  }> {
    // Get provider's policies and settings
    const provider = await prisma.providerProfile.findUnique({
      where: { id: params.providerId },
      include: {
        policies: true,
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Get previous messages from this provider for style learning
    let previousMessages: string[] = [];
    if (params.conversationId) {
      const messages = await prisma.message.findMany({
        where: {
          conversationId: params.conversationId,
          sender: {
            providerProfile: {
              id: params.providerId,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          content: true,
        },
      });

      previousMessages = messages.map((m) => m.content);
    }

    // Find next available slot (simplified - next Monday-Friday 9 AM)
    const nextAvailableSlot = this.findNextAvailableSlot(provider.availability);

    // Determine communication style based on previous messages or default
    const communicationStyle = this.detectCommunicationStyle(previousMessages);

    // Build prompt for AI
    const styleDescriptions = {
      professional:
        'Professional, polite, and informative. Use proper grammar and maintain business etiquette.',
      friendly:
        'Warm and approachable while maintaining professionalism. Use conversational language.',
      casual: 'Relaxed and conversational. Use casual language but remain respectful.',
      warm: 'Warm, welcoming, and personal. Show genuine care and enthusiasm.',
    };

    const policyText = provider.policies
      ? `
Provider Policies:
- Deposits Required: Yes (mandatory for all bookings)
${provider.policies.cancellationPolicyText ? `- Cancellation: ${provider.policies.cancellationPolicyText}` : ''}
${provider.policies.latePolicyText ? `- Late Arrival: ${provider.policies.latePolicyText}` : ''}
${provider.policies.refundPolicyText ? `- Refund: ${provider.policies.refundPolicyText}` : ''}
`
      : '';

    const availabilityText = nextAvailableSlot ? `Next Available: ${nextAvailableSlot}` : '';

    const styleContext =
      previousMessages.length > 0
        ? `Previous Provider Messages:\n${previousMessages.slice(0, 3).join('\n')}`
        : '';

    const prompt = `You are helping a beauty professional respond to a client message.

${policyText}
${availabilityText}
${styleContext}

Style: ${styleDescriptions[communicationStyle]}

Client's Message: "${params.clientMessage}"

Generate a helpful reply (2-4 sentences) that:
1. Addresses the client's question
2. References policies if relevant
3. Suggests time slots if asking about availability
4. Matches the provider's ${communicationStyle} style

Reply:`;

    const draft = await aiService.generateText(prompt);

    // Calculate confidence
    let confidence = 0.7;
    if (provider.policies) confidence += 0.1;
    if (nextAvailableSlot) confidence += 0.1;
    if (previousMessages.length > 0) confidence += 0.1;

    return {
      draft: draft.trim(),
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Generate chatbot response for homepage or provider profile
   */
  async generateChatbotResponse(params: ChatbotQueryParams): Promise<string> {
    if (params.context === 'homepage') {
      // Homepage chatbot - general platform help
      const prompt = `You are a helpful assistant for Beauty N Brushes, a visual-first beauty services marketplace.

Help clients find beauty services (hair, makeup, nails, lashes, brows, skincare), navigate the platform, and understand how booking works.

Client Question: "${params.query}"

Provide a concise (2-3 sentences), friendly, helpful response:`;

      return aiService.generateText(prompt);
    } else {
      // Provider profile chatbot
      if (!params.providerId) {
        throw new Error('Provider ID required for provider profile context');
      }

      const provider = await prisma.providerProfile.findUnique({
        where: { id: params.providerId },
        include: {
          services: {
            where: { active: true },
            select: {
              title: true,
              priceMin: true,
              priceMax: true,
              durationMinutes: true,
              category: {
                select: { name: true },
              },
            },
            take: 10,
          },
          policies: true,
          availability: true,
        },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      const nextAvailableSlot = this.findNextAvailableSlot(provider.availability);

      const servicesInfo = provider.services
        .map(
          (s) =>
            `- ${s.title}: $${Number(s.priceMin)}${s.priceMax ? `-$${Number(s.priceMax)}` : ''} (${s.durationMinutes} min)`
        )
        .join('\n');

      const prompt = `You are answering questions about ${provider.businessName}, a beauty professional.

Services:
${servicesInfo}

${provider.policies?.cancellationPolicyText ? `Cancellation Policy: ${provider.policies.cancellationPolicyText}` : ''}
Deposits required for all bookings.
${nextAvailableSlot ? `Next Available: ${nextAvailableSlot}` : ''}

Client Question: "${params.query}"

Provide a helpful, concise answer (2-3 sentences) based only on the information above. If you don't know, suggest sending a direct message.

Answer:`;

      return aiService.generateText(prompt);
    }
  }

  /**
   * Detect communication style from previous messages
   */
  private detectCommunicationStyle(
    messages: string[]
  ): 'professional' | 'friendly' | 'casual' | 'warm' {
    if (messages.length === 0) {
      return 'professional'; // Default
    }

    const combinedText = messages.join(' ').toLowerCase();

    // Simple heuristics
    const emojiCount = (combinedText.match(/[😊👍✨💕❤️🎉]/g) || []).length;
    const casualWords = ['hey', 'yeah', 'yep', 'cool', 'awesome', 'totally'];
    const casualCount = casualWords.filter((word) => combinedText.includes(word)).length;

    if (emojiCount >= 3 || casualCount >= 3) {
      return 'friendly';
    }

    if (emojiCount >= 5) {
      return 'warm';
    }

    const formalWords = ['certainly', 'absolutely', 'pleased', 'appreciate'];
    const formalCount = formalWords.filter((word) => combinedText.includes(word)).length;

    if (formalCount >= 2) {
      return 'professional';
    }

    return 'friendly'; // Default middle ground
  }

  /**
   * Find next available slot from availability schedule
   * Simplified version - returns next business day at 9 AM
   */
  private findNextAvailableSlot(
    availability: Array<{ dayOfWeek: number; startTime: string; isAvailable: boolean }>
  ): string | undefined {
    if (!availability || availability.length === 0) {
      return undefined;
    }

    const availableDays = availability.filter((a) => a.isAvailable);
    if (availableDays.length === 0) {
      return undefined;
    }

    // Get next available day
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Find next available day in schedule
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const daySchedule = availableDays.find((a) => a.dayOfWeek === nextDay);

      if (daySchedule) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);

        const dayNames = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const dayName = dayNames[nextDay];

        return `${dayName}, ${nextDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} at ${daySchedule.startTime}`;
      }
    }

    return undefined;
  }
}

export const aiMessagingService = new AIMessagingService();
