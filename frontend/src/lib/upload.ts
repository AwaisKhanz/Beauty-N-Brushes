/**
 * Centralized Upload Service
 * Handles all file uploads to the backend
 */

type UploadType = 'profile' | 'logo' | 'cover' | 'service';

interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
}

class UploadService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  }

  /**
   * Configure XMLHttpRequest for cookie-based auth
   */
  private configureXHR(xhr: XMLHttpRequest): void {
    // Enable credentials to send cookies
    xhr.withCredentials = true;
  }

  /**
   * Upload single file
   */
  async uploadFile(file: File, type: UploadType, options?: UploadOptions): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      if (options?.onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            options.onProgress!(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data.file);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${this.apiUrl}/upload?type=${type}`);
      this.configureXHR(xhr);
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    type: UploadType = 'service',
    options?: UploadOptions
  ): Promise<UploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      if (options?.onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            options.onProgress!(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data.files);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${this.apiUrl}/upload/multiple?type=${type}`);
      this.configureXHR(xhr);
      xhr.send(formData);
    });
  }

  /**
   * Delete file by URL
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Check file type (images only for now)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed.',
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const uploadService = new UploadService();

// Export types
export type { UploadType, UploadResult, UploadOptions };
