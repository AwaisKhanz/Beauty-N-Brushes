import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import type { UploadResult } from '../types/service.types';

export class StorageService {
  private uploadDir: string;
  private publicUrl: string;

  constructor() {
    // For development, use local storage
    // In production, this would be replaced with Cloudinary/S3
    this.uploadDir = join(process.cwd(), 'uploads');
    this.publicUrl = process.env.APP_URL || 'http://localhost:5000';

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
      await mkdir(join(this.uploadDir, 'profiles'), { recursive: true });
      await mkdir(join(this.uploadDir, 'logos'), { recursive: true });
      await mkdir(join(this.uploadDir, 'covers'), { recursive: true });
      await mkdir(join(this.uploadDir, 'services'), { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string): string {
    const ext = originalName.split('.').pop();
    const randomString = randomBytes(16).toString('hex');
    return `${Date.now()}-${randomString}.${ext}`;
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(file: Buffer, originalName: string): Promise<UploadResult> {
    const fileName = this.generateFileName(originalName);
    const filePath = join(this.uploadDir, 'profiles', fileName);

    await writeFile(filePath, file);

    const url = `${this.publicUrl}/uploads/profiles/${fileName}`;

    // Note: In production, use sharp library to generate optimized thumbnails
    // For now, return the same URL
    return {
      url,
      thumbnailUrl: url,
      mediumUrl: url,
      largeUrl: url,
    };
  }

  /**
   * Upload business logo
   */
  async uploadLogo(file: Buffer, originalName: string): Promise<UploadResult> {
    const fileName = this.generateFileName(originalName);
    const filePath = join(this.uploadDir, 'logos', fileName);

    await writeFile(filePath, file);

    const url = `${this.publicUrl}/uploads/logos/${fileName}`;

    return {
      url,
      thumbnailUrl: url,
      mediumUrl: url,
      largeUrl: url,
    };
  }

  /**
   * Upload cover photo
   */
  async uploadCoverPhoto(file: Buffer, originalName: string): Promise<UploadResult> {
    const fileName = this.generateFileName(originalName);
    const filePath = join(this.uploadDir, 'covers', fileName);

    await writeFile(filePath, file);

    const url = `${this.publicUrl}/uploads/covers/${fileName}`;

    return {
      url,
      thumbnailUrl: url,
      mediumUrl: url,
      largeUrl: url,
    };
  }

  /**
   * Upload service media
   */
  async uploadServiceMedia(file: Buffer, originalName: string): Promise<UploadResult> {
    const fileName = this.generateFileName(originalName);
    const filePath = join(this.uploadDir, 'services', fileName);

    await writeFile(filePath, file);

    const url = `${this.publicUrl}/uploads/services/${fileName}`;

    return {
      url,
      thumbnailUrl: url,
      mediumUrl: url,
      largeUrl: url,
    };
  }

  /**
   * Delete file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const fileName = fileUrl.split('/').pop();
      if (!fileName) return;

      // Determine directory from URL
      let directory = 'profiles';
      if (fileUrl.includes('/logos/')) directory = 'logos';
      if (fileUrl.includes('/covers/')) directory = 'covers';
      if (fileUrl.includes('/services/')) directory = 'services';

      const filePath = join(this.uploadDir, directory, fileName);
      await unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  /**
   * Validate file type
   */
  validateImageFile(mimeType: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return allowedTypes.includes(mimeType);
  }

  /**
   * Validate file size (in bytes)
   */
  validateFileSize(size: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }
}

export const storageService = new StorageService();
