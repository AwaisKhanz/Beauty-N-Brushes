'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhotoUpload } from './PhotoUpload';
import { Trash2, ZoomIn } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface BookingPhoto {
  id: string;
  photoType: 'BEFORE' | 'AFTER' | 'REFERENCE';
  imageUrl: string;
  caption: string | null;
  createdAt: string;
}

interface BookingPhotosProps {
  bookingId: string;
  photos: BookingPhoto[];
  canUpload: boolean;
  canDelete: boolean;
  onUpdate: () => void;
}

export function BookingPhotos({
  bookingId,
  photos,
  canUpload,
  canDelete,
  onUpdate,
}: BookingPhotosProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (photoId: string) => {
    try {
      setDeletingId(photoId);
      await api.bookings.deletePhoto(bookingId, photoId);
      toast.success('Photo deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete photo');
    } finally {
      setDeletingId(null);
    }
  };

  const renderPhotoGrid = (type: 'BEFORE' | 'AFTER' | 'REFERENCE') => {
    const typePhotos = photos.filter((p) => p.photoType === type);

    return (
      <div className="space-y-4">
        {canUpload && (
          <PhotoUpload
            bookingId={bookingId}
            photoType={type}
            onSuccess={onUpdate}
          />
        )}
        
        {typePhotos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No {type.toLowerCase()} photos yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {typePhotos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || `${type} photo`}
                  fill
                  className="object-cover"
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={photo.imageUrl}
                          alt={photo.caption || `${type} photo`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  {canDelete && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDelete(photo.id)}
                      disabled={deletingId === photo.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Photos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reference">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reference">Reference</TabsTrigger>
            <TabsTrigger value="before">Before</TabsTrigger>
            <TabsTrigger value="after">After</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reference" className="mt-4">
            {renderPhotoGrid('REFERENCE')}
          </TabsContent>
          
          <TabsContent value="before" className="mt-4">
            {renderPhotoGrid('BEFORE')}
          </TabsContent>
          
          <TabsContent value="after" className="mt-4">
            {renderPhotoGrid('AFTER')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
