import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import type { ServiceDraftData, SaveDraftRequest, ServiceWizardData } from '../../../shared-types';

const DRAFT_EXPIRY_DAYS = 30;

// Type guard to validate draft data structure
function isValidDraftData(data: unknown): data is Partial<ServiceWizardData> {
  return typeof data === 'object' && data !== null;
}

export const serviceDraftService = {
  async save(providerId: string, data: SaveDraftRequest): Promise<ServiceDraftData> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DRAFT_EXPIRY_DAYS);

    // Convert to Prisma JsonValue
    const jsonData = data.draftData as Prisma.InputJsonValue;

    // Upsert: update if exists, create if not
    const draft = await prisma.serviceDraft.upsert({
      where: { providerId },
      update: {
        draftData: jsonData,
        currentStep: data.currentStep,
        updatedAt: new Date(),
      },
      create: {
        providerId,
        draftData: jsonData,
        currentStep: data.currentStep,
        expiresAt,
      },
    });

    // Safely cast from Prisma JsonValue to our type
    const draftData = isValidDraftData(draft.draftData) ? draft.draftData : {};

    return {
      id: draft.id,
      draftData,
      currentStep: draft.currentStep,
      updatedAt: draft.updatedAt.toISOString(),
    };
  },

  async get(providerId: string): Promise<ServiceDraftData | null> {
    const draft = await prisma.serviceDraft.findUnique({
      where: { providerId },
    });

    if (!draft) return null;

    // Check if expired
    if (draft.expiresAt < new Date()) {
      await this.delete(providerId);
      return null;
    }

    // Safely cast from Prisma JsonValue to our type
    const draftData = isValidDraftData(draft.draftData) ? draft.draftData : {};

    return {
      id: draft.id,
      draftData,
      currentStep: draft.currentStep,
      updatedAt: draft.updatedAt.toISOString(),
    };
  },

  async delete(providerId: string): Promise<void> {
    await prisma.serviceDraft.deleteMany({
      where: { providerId },
    });
  },
};
