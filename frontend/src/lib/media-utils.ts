/**
 * Media Validation Utilities
 * Client-side validation for service media uploads
 */

export const MEDIA_LIMITS = {
  MAX_IMAGES: 10,
  MAX_VIDEO_DURATION_SECONDS: 60,
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
};

/**
 * Get video file duration in seconds
 */
export const getVideoFileDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;

      if (isNaN(duration) || !isFinite(duration)) {
        reject(new Error('Failed to determine video duration'));
      } else {
        resolve(duration);
      }
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Validate a media file before upload
 * Returns error message if invalid, null if valid
 */
export const validateMediaFile = async (
  file: File,
  currentImageCount: number = 0
): Promise<string | null> => {
  // Check file type
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return 'File must be an image or video';
  }

  // Validate image type
  if (isImage && !MEDIA_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Image must be JPEG, PNG, or WebP format';
  }

  // Validate video type
  if (isVideo && !MEDIA_LIMITS.ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return 'Video must be MP4, MOV, or WebM format';
  }

  // Check image count limit
  if (isImage && currentImageCount >= MEDIA_LIMITS.MAX_IMAGES) {
    return `Maximum ${MEDIA_LIMITS.MAX_IMAGES} images allowed per service`;
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MEDIA_LIMITS.MAX_FILE_SIZE_MB) {
    return `File size must be under ${MEDIA_LIMITS.MAX_FILE_SIZE_MB}MB (current: ${fileSizeMB.toFixed(1)}MB)`;
  }

  // Check video duration
  if (isVideo) {
    try {
      const duration = await getVideoFileDuration(file);

      if (duration > MEDIA_LIMITS.MAX_VIDEO_DURATION_SECONDS) {
        return `Video must be ${MEDIA_LIMITS.MAX_VIDEO_DURATION_SECONDS} seconds or less (current: ${Math.round(duration)}s)`;
      }
    } catch (error) {
      console.error('Error validating video duration:', error);
      return 'Failed to validate video duration. Please try another file.';
    }
  }

  return null; // Valid
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format duration for display (seconds to MM:SS)
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get media type from file
 */
export const getMediaType = (file: File): 'image' | 'video' | null => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return null;
};

/**
 * Create thumbnail from video file
 */
export const createVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of duration, whichever is shorter
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

      // Clean up
      window.URL.revokeObjectURL(video.src);

      resolve(thumbnailUrl);
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to create video thumbnail'));
    };

    video.src = URL.createObjectURL(file);
  });
};
