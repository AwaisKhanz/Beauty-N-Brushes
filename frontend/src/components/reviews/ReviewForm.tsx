'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Upload, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

const reviewSchema = z.object({
  overallRating: z.number().min(1, 'Please select a rating').max(5),
  qualityRating: z.number().min(1).max(5).optional(),
  timelinessRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  reviewText: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  bookingId: string;
  serviceTitle: string;
  providerName: string;
  onSuccess: () => void;
}

export function ReviewForm({ bookingId, serviceTitle, providerName, onSuccess }: ReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const {
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
  });

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length + photoFiles.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    // Validate file sizes (5MB max per requirements)
    const invalidFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Each photo must be under 5MB');
      return;
    }

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotoFiles((prev) => [...prev, ...files]);
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (overallRating === 0) {
      setError('Please select an overall rating');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Upload photos if any
      let photoUrls: string[] = [];
      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        const uploadRes = await api.upload.multiple(photoFiles, 'review');
        if (uploadRes.success && uploadRes.data) {
          photoUrls = uploadRes.data.files.map((f) => f.url);
        }
        setUploadingPhotos(false);
      }

      // Create review
      await api.reviews.create({
        bookingId,
        overallRating,
        qualityRating: qualityRating || undefined,
        timelinessRating: timelinessRating || undefined,
        professionalismRating: professionalismRating || undefined,
        reviewText: reviewText.trim() || undefined,
        mediaFiles: photoUrls.length > 0 ? photoUrls : undefined,
      });

      toast.success('Review submitted', {
        description: 'Thank you for your feedback!',
      });

      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to submit review');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Info */}
      <Card>
        <CardContent className="p-4">
          <div>
            <h3 className="font-semibold">{serviceTitle}</h3>
            <p className="text-sm text-muted-foreground">{providerName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Overall Rating */}
      <div className="space-y-2">
        <Label className="text-base">Overall Experience *</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setOverallRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= overallRating
                    ? 'fill-rating-filled text-rating-filled'
                    : 'text-rating-empty'
                }`}
              />
            </button>
          ))}
        </div>
        {errors.overallRating && (
          <p className="text-sm text-destructive">{errors.overallRating.message}</p>
        )}
      </div>

      {/* Detailed Ratings */}
      <div className="space-y-4">
        <Label className="text-base">Rate Specific Aspects</Label>

        {/* Quality */}
        <div className="space-y-2">
          <Label className="text-sm font-normal">Quality of Service</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setQualityRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= qualityRating
                      ? 'fill-rating-filled text-rating-filled'
                      : 'text-rating-empty'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Timeliness */}
        <div className="space-y-2">
          <Label className="text-sm font-normal">Timeliness</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setTimelinessRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= timelinessRating
                      ? 'fill-rating-filled text-rating-filled'
                      : 'text-rating-empty'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Professionalism */}
        <div className="space-y-2">
          <Label className="text-sm font-normal">Professionalism</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setProfessionalismRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= professionalismRating
                      ? 'fill-rating-filled text-rating-filled'
                      : 'text-rating-empty'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Written Review */}
      <div className="space-y-2">
        <Label htmlFor="reviewText">Your Review (Optional)</Label>
        <Textarea
          id="reviewText"
          placeholder="Share your experience with this service..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Photos (Optional)</Label>
        <p className="text-sm text-muted-foreground">
          Share photos of your results (max 5 photos, 5MB each)
        </p>

        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                <Image
                  src={preview}
                  alt={`Review photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {photoFiles.length < 5 && (
          <div>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="sr-only"
            />
            <label htmlFor="photo-upload">
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload photos</p>
              </div>
            </label>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || uploadingPhotos || overallRating === 0}
          className="flex-1 bg-button-dark hover:bg-button-dark/90"
        >
          {loading ? 'Submitting...' : uploadingPhotos ? 'Uploading photos...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
