'use client';

import { useState, useCallback, useRef } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Video as VideoIcon,
  Star,
  Edit,
  Camera,
  Play,
  GripVertical,
} from 'lucide-react';
import Image from 'next/image';
import { ServiceWizardData } from '../ServiceCreationWizard';
import { extractErrorMessage } from '@/lib/error-utils';
import { validateMediaFile, MEDIA_LIMITS } from '@/lib/media-utils';

interface MediaUploadStepProps {
  form: UseFormReturn<ServiceWizardData>;
  onNext?: () => void;
  isEdit?: boolean;
}

interface MediaItem {
  url: string;
  thumbnailUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  isFeatured: boolean;
  displayOrder: number;
}

// Removed unused constants - now using open input fields for AI suggestions

export function MediaUploadStep({ form }: MediaUploadStepProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingMedia, setEditingMedia] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { fields, append, remove, update, move } = useFieldArray({
    control: form.control,
    name: 'media',
  });

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Check file limits
      if (fields.length + files.length > 15) {
        toast.error('Maximum 15 files allowed');
        return;
      }

      // Validate files with proper limits
      const currentImageCount = fields.filter((f) => f.mediaType === 'image').length;
      const newImageCount = files.filter((f) => f.type.startsWith('image/')).length;

      // Check if adding these files would exceed image limit
      if (currentImageCount + newImageCount > MEDIA_LIMITS.MAX_IMAGES) {
        toast.error(
          `Maximum ${MEDIA_LIMITS.MAX_IMAGES} images allowed. You currently have ${currentImageCount} and are trying to add ${newImageCount} more.`
        );
        return;
      }

      // Validate each file
      for (const file of files) {
        const imageCountForFile =
          currentImageCount +
          Array.from(files)
            .slice(0, Array.from(files).indexOf(file))
            .filter((f) => f.type.startsWith('image/')).length;

        const validationError = await validateMediaFile(file, imageCountForFile);

        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          return;
        }
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(((i + 1) / files.length) * 100);

          // Upload file
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload?type=service`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          const result = await response.json();
          // Add to form
          const mediaItem: MediaItem = {
            url: result.data.file.url,
            thumbnailUrl: result.data.file.thumbnailUrl || result.data.file.url,
            mediaType: (file.type.startsWith('image/') ? 'image' : 'video') as 'image' | 'video',
            isFeatured: fields.length === 0, // First image is featured by default
            displayOrder: fields.length,
            caption: '',
          };

          append(mediaItem);
        }

        toast.success(`${files.length} file(s) uploaded successfully!`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(extractErrorMessage(error) || 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [fields.length, append]
  );

  const removeMedia = (index: number) => {
    remove(index);
    // Update display orders
    fields.forEach((field, i) => {
      if (i > index) {
        update(i - 1, { ...field, displayOrder: i - 1 });
      }
    });
  };

  const setFeatured = (index: number) => {
    // Remove featured from all others
    fields.forEach((field, i) => {
      update(i, { ...field, isFeatured: i === index });
    });
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    move(fromIndex, toIndex);

    // Update display orders
    const newFields = [...fields];
    const [movedItem] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedItem);

    newFields.forEach((field, i) => {
      update(i, { ...field, displayOrder: i });
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== index) {
      moveMedia(draggedItem, index);
      setDraggedItem(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const updateMediaField = (
    index: number,
    field: keyof MediaItem,
    value: string | boolean | number
  ) => {
    try {
      const currentMedia = fields[index];
      const updatedMedia = { ...currentMedia, [field]: value };
      update(index, updatedMedia);
    } catch (error) {
      console.error('Error in updateMediaField:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Upload Photos & Videos
            <Badge variant="secondary">
              {fields.filter((f) => f.mediaType === 'image').length}/{MEDIA_LIMITS.MAX_IMAGES}{' '}
              images
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {fields.length === 0 ? 'Upload your first image or video' : 'Add more media'}
            </h3>
            <p className="text-muted-foreground mb-4">Drag and drop or click to select files</p>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Images: JPG, PNG
              </span>
              <span className="flex items-center gap-1">
                <VideoIcon className="h-4 w-4" />
                Videos: MP4, MOV (max 60s)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Maximum file size: 10MB each</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Grid */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Your Media
              <Badge variant="outline">
                {fields.filter((f) => f.isFeatured).length > 0
                  ? 'Featured set'
                  : 'No featured image'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((media, index) => (
                <div
                  key={`${media.url}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative border rounded-lg overflow-hidden cursor-move transition-all ${
                    media.isFeatured ? 'ring-2 ring-yellow-400' : ''
                  } ${draggedItem === index ? 'opacity-50' : ''}`}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
                  </div>

                  {/* Media Preview */}
                  <div className="aspect-square relative bg-muted">
                    {media.mediaType === 'image' ? (
                      <Image
                        src={media.thumbnailUrl || media.url}
                        alt={media.caption || 'Service image'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Play className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Featured Badge */}
                    {media.isFeatured && (
                      <Badge className="absolute top-2 right-2 bg-warning text-warning-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingMedia(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMedia(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-2 space-y-2">
                    <div className="flex gap-1">
                      {!media.isFeatured && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFeatured(index)}
                          className="text-xs"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Set Featured
                        </Button>
                      )}
                    </div>

                    {/* Caption Preview */}
                    {media.caption && (
                      <p className="text-xs text-muted-foreground truncate">{media.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Editing Dialog */}
      <Dialog open={editingMedia !== null} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Media Details</DialogTitle>
            <DialogDescription>
              Add captions and AI tags to help clients understand your work
            </DialogDescription>
          </DialogHeader>

          {editingMedia !== null && fields[editingMedia] && (
            <div className="space-y-6">
              {/* Media Preview */}
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                {fields[editingMedia].mediaType === 'image' ? (
                  <Image
                    src={fields[editingMedia].url}
                    alt="Media preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Play className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  key={`caption-${editingMedia}`}
                  placeholder="Describe what's shown in this image/video..."
                  defaultValue={fields[editingMedia].caption || ''}
                  onChange={(e) => updateMediaField(editingMedia, 'caption', e.target.value)}
                  className="resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <Button onClick={() => setEditingMedia(null)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Requirements & Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-info/10 border-info/20">
          <CardContent className="p-4">
            <h4 className="font-medium text-muted-foreground   mb-2">📸 Photo Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use good lighting (natural light works best)</li>
              <li>• Show clear before/after shots when possible</li>
              <li>• Include multiple angles of your work</li>
              <li>• Set one image as "featured" for main display</li>
              <li>• Add captions to explain your techniques</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4">
            <h4 className="font-medium text-muted-foreground mb-2">🎬 Video Guidelines</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Keep videos under 60 seconds</li>
              <li>• Show your process or final reveal</li>
              <li>• Ensure good audio quality</li>
              <li>• Start with an attention-grabbing moment</li>
              <li>• Videos can significantly boost engagement</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              fields.length === 0
                ? 'bg-destructive'
                : fields.length >= 1
                  ? 'bg-success'
                  : 'bg-warning'
            }`}
          />
          <span className="text-sm font-medium">
            {fields.length === 0
              ? 'At least one image or video is required'
              : fields.length >= 3
                ? 'Great! Your service has plenty of visual content'
                : 'Consider adding more photos to showcase your work'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {fields.length}/15 files ({fields.filter((f) => f.mediaType === 'image').length} images,
          max {MEDIA_LIMITS.MAX_IMAGES})
        </div>
      </div>
    </div>
  );
}
