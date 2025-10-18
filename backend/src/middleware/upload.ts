import multer from 'multer';
import { AppError } from './errorHandler';
import type { Request, Response, NextFunction } from 'express';

// Media limits configuration
export const MEDIA_LIMITS = {
  MAX_IMAGES: 10,
  MAX_VIDEO_DURATION_SECONDS: 60,
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
};

// Configure multer for memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter to allow images and videos
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [...MEDIA_LIMITS.ALLOWED_IMAGE_TYPES, ...MEDIA_LIMITS.ALLOWED_VIDEO_TYPES];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, MOV, WebM) are allowed.'
      )
    );
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MEDIA_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

// Export field configurations for different upload scenarios
export const profileMediaUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]);

export const serviceMediaUpload = upload.array('serviceMedia', 15); // Max 15 files (10 images + videos)

/**
 * Get video duration from buffer using probe
 */
async function getVideoDuration(buffer: Buffer): Promise<number> {
  try {
    // Use a simple approach with temp file for now
    // In production, consider using fluent-ffmpeg or similar
    const fs = await import('fs');
    const path = await import('path');
    const { promisify } = await import('util');
    const exec = promisify((await import('child_process')).exec);

    const tmpDir = '/tmp';
    const tmpFile = path.join(tmpDir, `video-${Date.now()}.tmp`);

    // Write buffer to temp file
    await fs.promises.writeFile(tmpFile, buffer);

    try {
      // Use ffprobe to get duration
      const { stdout } = await exec(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tmpFile}"`
      );

      const duration = parseFloat(stdout.trim());

      // Clean up temp file
      await fs.promises.unlink(tmpFile);

      return duration;
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.promises.unlink(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting video duration:', error);
    // If we can't determine duration, assume it's too long to be safe
    return 999;
  }
}

/**
 * Validate service media uploads
 * Checks image count, video duration, and file sizes
 */
export async function validateServiceMedia(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return next();
    }

    // Separate images and videos
    const images = files.filter((f) => f.mimetype.startsWith('image/'));
    const videos = files.filter((f) => f.mimetype.startsWith('video/'));

    // Validate image count
    if (images.length > MEDIA_LIMITS.MAX_IMAGES) {
      throw new AppError(
        400,
        `Maximum ${MEDIA_LIMITS.MAX_IMAGES} images allowed per service. You uploaded ${images.length} images.`
      );
    }

    // Validate video durations
    for (const video of videos) {
      const duration = await getVideoDuration(video.buffer);

      if (duration > MEDIA_LIMITS.MAX_VIDEO_DURATION_SECONDS) {
        throw new AppError(
          400,
          `Video "${video.originalname}" is ${Math.round(duration)}s long. Videos must be ${MEDIA_LIMITS.MAX_VIDEO_DURATION_SECONDS} seconds or less.`
        );
      }
    }

    // Validate file sizes (already handled by multer, but adding explicit check)
    const oversizedFiles = files.filter(
      (f) => f.size > MEDIA_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      throw new AppError(
        400,
        `Files must be under ${MEDIA_LIMITS.MAX_FILE_SIZE_MB}MB. ${oversizedFiles.length} file(s) exceeded this limit.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
