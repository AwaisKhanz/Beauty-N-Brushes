/**
 * Service Types
 */

export interface CreateServiceData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priceMin: number;
  priceMax?: number;
  priceType: 'fixed' | 'range' | 'starting_at';
  durationMinutes: number;
  depositType: 'percentage' | 'fixed';
  depositAmount: number;
  addons?: Array<{
    name: string;
    description?: string;
    price: number;
    duration: number;
  }>;
  // Template tracking
  createdFromTemplate?: boolean;
  templateId?: string;
  templateName?: string;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
}
