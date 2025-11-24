/**
 * Instagram Integration Types
 *
 * Types for Instagram OAuth flow and media import functionality.
 * Allows providers to connect their Instagram account and import portfolio images.
 *
 * @module shared-types/instagram
 *
 * **Backend Usage:**
 * - `backend/src/controllers/instagram.controller.ts`
 * - `backend/src/lib/instagram.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts`
 * - `frontend/src/components/onboarding/steps/Step3ProfileMedia.tsx`
 */

// ================================
// Instagram Request Types
// ================================

/**
 * Request to initiate Instagram OAuth connection
 * No body required - uses authenticated user ID
 * @interface
 */
export interface ConnectInstagramRequest {
  // No body needed - userId from auth
}

/**
 * Request to import media from Instagram
 * No body required - uses connected account
 * @interface
 */
export interface ImportMediaRequest {
  // No body needed - uses connected account
}

/**
 * Request to disconnect Instagram account
 * No body required - uses authenticated user ID
 * @interface
 */
export interface DisconnectInstagramRequest {
  // No body needed - userId from auth
}

// ================================
// Instagram Response Types
// ================================

/**
 * Response containing Instagram OAuth URL
 * @interface
 */
export interface ConnectInstagramResponse {
  /** URL to redirect user for Instagram authorization */
  authUrl: string;
  /** Instruction message */
  message: string;
}

/**
 * Instagram media item structure
 * @interface
 */
export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

export interface ImportInstagramMediaResponse {
  message: string;
  media: InstagramMedia[];
  total: number;
}

export interface DisconnectInstagramResponse {
  message: string;
}

// ================================
// Imported Media Types
// ================================

export interface ImportedMedia {
  id: string;
  instagramMediaId: string;
  mediaUrl: string;
  mediaType: string;
  thumbnailUrl?: string;
  caption?: string;
  linkedToServiceId?: string | null;
  linkedToPortfolio: boolean;
  service?: {
    id: string;
    title: string;
  } | null;
  importedAt: string;
}

export interface GetImportedMediaResponse {
  message: string;
  media: ImportedMedia[];
  total: number;
}

export interface SaveImportedMediaRequest {
  mediaIds: string[];
}

export interface SaveImportedMediaResponse {
  message: string;
  imported: number;
}

export interface LinkMediaToServiceRequest {
  mediaId: string;
  serviceId: string;
}

export interface LinkMediaToServiceResponse {
  message: string;
}

// ================================
// Instagram Connection Status
// ================================

export interface InstagramConnectionStatus {
  connected: boolean;
  username?: string;
  userId?: string;
  tokenExpiry?: string;
  lastSyncAt?: string | null;
}
