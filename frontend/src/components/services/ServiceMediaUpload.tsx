'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { extractErrorMessage } from '@/lib/error-utils';
import Image from 'next/image';

interface UploadedFile {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      // Check if adding these files would exceed the limit
      if (uploadedFiles.length + files.length > maxFiles) {
        toast.error('Too many files', {
          description: `Maximum ${maxFiles} images allowed per service`,
        });
        return;
      }

      // Validate file types
      const invalidFiles = files.filter((file) => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        toast.error('Invalid file type', {
          description: 'Only image files are allowed',
        });
        return;
      }

      // Validate file sizes (10MB each)
      const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('File too large', {
          description: 'Each image must be less than 10MB',
        });
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/upload/multiple?type=service`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();

        if (result.success && result.data?.files) {
          const newFiles = result.data.files as UploadedFile[];
          const updatedFiles = [...uploadedFiles, ...newFiles];
          setUploadedFiles(updatedFiles);

          // Notify parent component
          if (onMediaUploaded) {
            onMediaUploaded(updatedFiles.map((f) => f.url));
          }

          // If serviceId is provided, save media to backend
          if (serviceId) {
            await saveMediaToService(updatedFiles.map((f) => f.url));
          }

          toast.success('Images uploaded successfully', {
            description: `${newFiles.length} image(s) added to your service`,
          });
        }
      } catch (error: unknown) {
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
    [uploadedFiles, maxFiles, onMediaUploaded, serviceId]
  );

  const saveMediaToService = async (mediaUrls: string[]) => {
    if (!serviceId) return;

    try {
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
        throw new Error('Failed to save media');
      }
    } catch (error: unknown) {
      console.error('Error saving media:', error);
      toast.error('Failed to save media to service', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    }
  };

  const removeFile = async (index: number) => {
    const fileToRemove = uploadedFiles[index];

    try {
      // Delete from server
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: fileToRemove.url }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Remove from local state
      const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(updatedFiles);

      // Notify parent
      if (onMediaUploaded) {
        onMediaUploaded(updatedFiles.map((f) => f.url));
      }

      toast.success('Image removed');
    } catch (error: unknown) {
      toast.error('Failed to remove image', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Service Photos
        </CardTitle>
        <CardDescription>
          Upload photos of your work (up to {maxFiles} images, max 10MB each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="service-media"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || uploadedFiles.length >= maxFiles}
          />
          <label
            htmlFor="service-media"
            className={`cursor-pointer ${uploading || uploadedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  {uploading ? 'Uploading...' : 'Click to upload service photos'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP up to 10MB • {uploadedFiles.length}/{maxFiles} images
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Uploaded Files Grid */}
        {uploadedFiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={file.thumbnailUrl || file.url}
                    alt={file.fileName}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                    {file.fileName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        {uploadedFiles.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg border border-primary/20">
            <Check className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">
              {uploadedFiles.length} image{uploadedFiles.length > 1 ? 's' : ''} uploaded
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
