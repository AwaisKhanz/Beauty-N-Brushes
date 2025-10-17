/**
 * Shared Upload Types
 * Used by both frontend and backend
 */

export type UploadType = 'profile' | 'logo' | 'cover' | 'service';

// ============================================
// Request Types
// ============================================

export interface DeleteFileRequest {
  fileUrl: string;
}

// ============================================
// Response Types
// ============================================

export interface UploadedFile {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadFileResponse {
  success: true;
  data: {
    file: UploadedFile;
  };
}

export interface UploadMultipleFilesResponse {
  success: true;
  data: {
    files: UploadedFile[];
  };
}

export interface DeleteFileResponse {
  success: true;
  message: string;
}
