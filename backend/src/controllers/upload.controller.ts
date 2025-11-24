import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { storageService } from '../lib/storage';
import type { AuthRequest } from '../types';

/**
 * Upload single file (image, document, etc.)
 */
export async function uploadFile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;

    if (!file) {
      throw new AppError(400, 'No file uploaded');
    }

    // Validate file size (10MB max)
    if (!storageService.validateFileSize(file.size, 10)) {
      throw new AppError(400, 'File size exceeds 10MB limit');
    }

    // Determine upload type from query parameter
    const uploadType = (req.query.type as string) || 'general';

    let result;

    switch (uploadType) {
      case 'profile':
        if (!storageService.validateImageFile(file.mimetype)) {
          throw new AppError(400, 'Invalid file format. Only images allowed for profile photos.');
        }
        result = await storageService.uploadProfilePhoto(file.buffer, file.originalname);
        break;

      case 'logo':
        if (!storageService.validateImageFile(file.mimetype)) {
          throw new AppError(400, 'Invalid file format. Only images allowed for logos.');
        }
        result = await storageService.uploadLogo(file.buffer, file.originalname);
        break;

      case 'cover':
        if (!storageService.validateImageFile(file.mimetype)) {
          throw new AppError(400, 'Invalid file format. Only images allowed for cover photos.');
        }
        result = await storageService.uploadCoverPhoto(file.buffer, file.originalname);
        break;

      case 'service':
        if (!storageService.validateImageFile(file.mimetype)) {
          throw new AppError(400, 'Invalid file format. Only images allowed for service media.');
        }
        result = await storageService.uploadServiceMedia(file.buffer, file.originalname);
        break;

      case 'inspiration':
        if (!storageService.validateImageFile(file.mimetype)) {
          throw new AppError(400, 'Invalid file format. Only images allowed for inspiration.');
        }
        result = await storageService.uploadServiceMedia(file.buffer, file.originalname);
        break;

      case 'reference':
        if (!storageService.validateImageFile(file.mimetype)) {
          throw new AppError(400, 'Invalid file format. Only images allowed for reference photos.');
        }
        result = await storageService.uploadServiceMedia(file.buffer, file.originalname);
        break;

      default:
        throw new AppError(
          400,
          'Invalid upload type. Use: profile, logo, cover, service, inspiration, or reference'
        );
    }

    sendSuccess(res, {
      message: 'File uploaded successfully',
      file: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        mediumUrl: result.mediumUrl,
        largeUrl: result.largeUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError(400, 'No files uploaded');
    }

    const uploadType = (req.query.type as string) || 'service';

    // Upload all files
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        // Validate file
        if (!storageService.validateImageFile(file.mimetype)) {
          throw new AppError(400, `Invalid file format: ${file.originalname}`);
        }
        if (!storageService.validateFileSize(file.size, 10)) {
          throw new AppError(400, `File too large: ${file.originalname}`);
        }

        // Upload based on type
        let result;
        if (uploadType === 'service') {
          result = await storageService.uploadServiceMedia(file.buffer, file.originalname);
        } else {
          result = await storageService.uploadServiceMedia(file.buffer, file.originalname);
        }

        return {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          mediumUrl: result.mediumUrl,
          largeUrl: result.largeUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        };
      })
    );

    sendSuccess(res, {
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete file by URL
 */
export async function deleteFile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      throw new AppError(400, 'File URL required');
    }

    await storageService.deleteFile(fileUrl);

    sendSuccess(res, {
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
