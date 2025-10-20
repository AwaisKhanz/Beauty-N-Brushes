'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Check,
  Star,
  Edit,
  ArrowUp,
  ArrowDown,
  Video as VideoIcon,
} from 'lucide-react';
import { extractErrorMessage } from '@/lib/error-utils';
import Image from 'next/image';

interface UploadedMedia {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'image' | 'video';
  caption?: string;
  displayOrder: number;
  isFeatured?: boolean;
}

interface ServiceMediaUploadProps {
  serviceId?: string;
  onMediaUploaded?: (urls: string[]) => void;
  maxFiles?: number;
}

export function ServiceMediaUpload({
  serviceId,
  onMediaUploaded,
  maxFiles = 10,
}: ServiceMediaUploadProps) {
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingMedia, setEditingMedia] = useState<UploadedMedia | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      // Check if adding these files would exceed the limit
      if (uploadedMedia.length + files.length > maxFiles) {
        toast.error('Too many files', {
          description: `Maximum ${maxFiles} images/videos allowed per service`,
        });
        return;
      }

      // Validate file types (images and videos)
      const invalidFiles = files.filter(
        (file) => !file.type.startsWith('image/') && !file.type.startsWith('video/')
      );
      if (invalidFiles.length > 0) {
        toast.error('Invalid file type', {
          description: 'Only image and video files are allowed',
        });
        return;
      }

      // Validate file sizes (10MB each)
      const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('File too large', {
          description: 'Each file must be less than 10MB',
        });
        return;
      }

      // Validate video duration (max 60 seconds)
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          const duration = await getVideoDuration(file);
          if (duration > 60) {
            toast.error('Video too long', {
              description: `Videos must be 60 seconds or less. "${file.name}" is ${Math.round(duration)}s`,
            });
            return;
          }
        }
      }

      setUploading(true);
      setUploadProgress(10);

      try {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });

        setUploadProgress(30);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/upload/multiple?type=service`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          }
        );

        setUploadProgress(60);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('[ServiceMediaUpload] Upload failed:', errorData);
          throw new Error(errorData?.error?.message || 'Upload failed');
        }

        const result = await response.json();

        setUploadProgress(80);

        if (result.success && result.data?.files) {
          const newMedia: UploadedMedia[] = result.data.files.map(
            (
              file: {
                url: string;
                thumbnailUrl?: string;
                mediumUrl?: string;
                largeUrl?: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
              },
              index: number
            ) => ({
              ...file,
              mediaType: file.mimeType.startsWith('video/') ? 'video' : 'image',
              displayOrder: uploadedMedia.length + index,
              caption: '',
              isFeatured: uploadedMedia.length === 0 && index === 0, // First upload is featured
            })
          );

          const updatedMedia = [...uploadedMedia, ...newMedia];
          setUploadedMedia(updatedMedia);

          // Notify parent component
          if (onMediaUploaded) {
            onMediaUploaded(updatedMedia.map((m) => m.url));
          }

          setUploadProgress(90);

          // If serviceId is provided, save media to backend
          if (serviceId) {
            await saveMediaToService(updatedMedia);
          }

          setUploadProgress(100);

          toast.success(`${newMedia.length} file(s) uploaded successfully`, {
            description: newMedia.some((m) => m.mediaType === 'video')
              ? 'Images and videos added'
              : 'Images added to your service',
          });
        } else {
          console.error('[ServiceMediaUpload] Unexpected response format:', result);
          throw new Error('Unexpected response format');
        }
      } catch (error: unknown) {
        console.error('[ServiceMediaUpload] Upload error:', error);
        toast.error('Upload failed', {
          description: extractErrorMessage(error) || 'Please try again',
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
        // Reset input
        event.target.value = '';
      }
    },
    [uploadedMedia, maxFiles, onMediaUploaded, serviceId]
  );

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const saveMediaToService = async (media: UploadedMedia[]) => {
    if (!serviceId) return;

    try {
      const mediaUrls = media.map((m) => ({
        url: m.url,
        thumbnailUrl: m.thumbnailUrl || m.url,
        mediaType: m.mediaType,
        caption: m.caption || '',
        displayOrder: m.displayOrder,
        isFeatured: m.isFeatured || false,
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/services/${serviceId}/media`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mediaUrls }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[ServiceMediaUpload] Save media failed:', errorData);
        throw new Error(errorData?.error?.message || 'Failed to save media');
      }
    } catch (error: unknown) {
      console.error('[ServiceMediaUpload] Error saving media:', error);
      toast.error('Failed to save media to service', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    }
  };

  const moveMedia = (index: number, direction: 'up' | 'down') => {
    const newMedia = [...uploadedMedia];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newMedia.length) return;

    // Swap
    [newMedia[index], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[index]];

    // Update display order
    newMedia.forEach((media, idx) => {
      media.displayOrder = idx;
    });

    setUploadedMedia(newMedia);

    if (serviceId) {
      saveMediaToService(newMedia);
    }

    toast.success('Order updated');
  };

  const setFeatured = (index: number) => {
    const newMedia = uploadedMedia.map((media, idx) => ({
      ...media,
      isFeatured: idx === index,
    }));

    setUploadedMedia(newMedia);

    if (serviceId) {
      saveMediaToService(newMedia);
    }

    toast.success('Featured image updated');
  };

  const updateMediaDetails = () => {
    if (!editingMedia) return;

    const newMedia = uploadedMedia.map((media) =>
      media.url === editingMedia.url ? editingMedia : media
    );

    setUploadedMedia(newMedia);

    if (serviceId) {
      saveMediaToService(newMedia);
    }

    setEditDialogOpen(false);
    setEditingMedia(null);
    toast.success('Media details updated');
  };

  const removeMedia = async (index: number) => {
    const mediaToRemove = uploadedMedia[index];

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: mediaToRemove.url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || 'Failed to delete file');
      }

      // Remove from local state and update display order
      const updatedMedia = uploadedMedia
        .filter((_, i) => i !== index)
        .map((media, idx) => ({
          ...media,
          displayOrder: idx,
        }));

      setUploadedMedia(updatedMedia);

      // Notify parent
      if (onMediaUploaded) {
        onMediaUploaded(updatedMedia.map((m) => m.url));
      }

      toast.success(`${mediaToRemove.mediaType === 'video' ? 'Video' : 'Image'} removed`);
    } catch (error: unknown) {
      console.error('[ServiceMediaUpload] Delete error:', error);
      toast.error('Failed to remove file', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Service Photos & Videos
          </CardTitle>
          <CardDescription>
            Upload photos and videos of your work (up to {maxFiles} files, max 10MB each, videos max
            60 seconds)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="service-media-upload"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || uploadedMedia.length >= maxFiles}
            />
            <label
              htmlFor="service-media-upload"
              className={`cursor-pointer block ${uploading || uploadedMedia.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                if (uploading || uploadedMedia.length >= maxFiles) {
                  e.preventDefault();
                }
              }}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {uploading ? 'Uploading...' : 'Click to upload photos & videos'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP, MP4, MOV • Max 10MB • Videos max 60s • {uploadedMedia.length}/
                    {maxFiles} files
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Uploaded Media Grid */}
          {uploadedMedia.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Drag to reorder • First image is the featured image
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {uploadedMedia.map((media, index) => (
                  <div
                    key={`${media.url}-${index}`}
                    className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                  >
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                        {media.mediaType === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <VideoIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <Image
                            src={media.thumbnailUrl || media.url}
                            alt={media.caption || media.fileName}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      {media.isFeatured && (
                        <Badge variant="default" className="absolute -top-2 -left-2 gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium truncate">{media.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {media.mediaType === 'video' ? 'Video' : 'Image'} •{' '}
                            {(media.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {media.caption && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {media.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          moveMedia(index, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          moveMedia(index, 'down');
                        }}
                        disabled={index === uploadedMedia.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>

                      {!media.isFeatured && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            setFeatured(index);
                          }}
                          title="Set as featured"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingMedia(media);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeMedia(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          {uploadedMedia.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg border border-primary/20">
              <Check className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                {uploadedMedia.length} file{uploadedMedia.length > 1 ? 's' : ''} uploaded (
                {uploadedMedia.filter((m) => m.mediaType === 'image').length} images,{' '}
                {uploadedMedia.filter((m) => m.mediaType === 'video').length} videos)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Media Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Media Details</DialogTitle>
            <DialogDescription>
              Add captions and AI tags to help clients find this service
            </DialogDescription>
          </DialogHeader>

          {editingMedia && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="w-32 h-32 rounded-lg overflow-hidden border bg-muted mx-auto">
                {editingMedia.mediaType === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <VideoIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                ) : (
                  <Image
                    src={editingMedia.thumbnailUrl || editingMedia.url}
                    alt={editingMedia.fileName}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                )}
              </div>

              {/* Caption */}
              <div>
                <Label htmlFor="caption">Caption / Description</Label>
                <Textarea
                  id="caption"
                  placeholder="Describe this work (e.g., 'Box braids with curly ends')"
                  value={editingMedia.caption || ''}
                  onChange={(e) => setEditingMedia({ ...editingMedia, caption: e.target.value })}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingMedia(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={updateMediaDetails}>
                  Save Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
