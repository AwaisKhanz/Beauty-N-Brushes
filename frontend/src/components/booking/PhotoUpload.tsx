'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

interface PhotoUploadProps {
  bookingId: string;
  photoType: 'BEFORE' | 'AFTER' | 'REFERENCE';
  onSuccess: () => void;
  className?: string;
}

export function PhotoUpload({ bookingId, photoType, onSuccess, className }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);

      // 1. Upload to storage
      // api.upload.file constructs FormData internally
      const uploadResponse = await api.upload.file(file, 'booking-photo');
      const photoUrl = uploadResponse.data.file.url;

      // 2. Add to booking
      await api.bookings.addPhoto(bookingId, {
        photoUrl,
        photoType,
        caption: file.name,
      });

      toast.success('Photo uploaded successfully');
      onSuccess();
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to upload photo';
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full gap-2 border-dashed"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? 'Uploading...' : `Upload ${photoType.toLowerCase()} photo`}
      </Button>
    </div>
  );
}
