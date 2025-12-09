'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  providerName: string;
  serviceName: string;
  onSuccess: () => void;
}

const RATING_CATEGORIES = [
  { key: 'overallRating', label: 'Overall Experience' },
  { key: 'qualityRating', label: 'Quality of Service' },
  { key: 'timelinessRating', label: 'Timeliness' },
  { key: 'professionalismRating', label: 'Professionalism' },
] as const;

export function ReviewModal({
  open,
  onOpenChange,
  bookingId,
  providerName,
  serviceName,
  onSuccess,
}: ReviewModalProps) {
  const [ratings, setRatings] = useState({
    overallRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    professionalismRating: 0,
  });
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRatingChange = (category: keyof typeof ratings, rating: number) => {
    setRatings((prev) => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate overall rating
      if (ratings.overallRating === 0) {
        setError('Please provide an overall rating');
        return;
      }

      await api.reviews.create({
        bookingId,
        overallRating: ratings.overallRating,
        qualityRating: ratings.qualityRating || undefined,
        timelinessRating: ratings.timelinessRating || undefined,
        professionalismRating: ratings.professionalismRating || undefined,
        reviewText: reviewText.trim() || undefined,
      });

      toast.success('Review submitted!', {
        description: 'Thank you for your feedback',
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setRatings({
        overallRating: 0,
        qualityRating: 0,
        timelinessRating: 0,
        professionalismRating: 0,
      });
      setReviewText('');
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err) || 'Failed to submit review';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ 
    rating, 
    onRatingChange 
  }: { 
    rating: number; 
    onRatingChange: (rating: number) => void 
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          disabled={loading}
          className="transition-transform hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={`h-6 w-6 ${
              star <= rating
                ? 'fill-rating-filled text-rating-filled'
                : 'fill-none text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-rating-filled" />
            Leave a Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Reviewing</p>
            <p className="font-semibold">{serviceName}</p>
            <p className="text-sm text-muted-foreground">at {providerName}</p>
          </div>

          {/* Rating categories */}
          <div className="space-y-4">
            {RATING_CATEGORIES.map((category) => (
              <div key={category.key} className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>{category.label}</span>
                  {category.key === 'overallRating' && (
                    <span className="text-xs text-destructive">Required</span>
                  )}
                </Label>
                <RatingStars
                  rating={ratings[category.key]}
                  onRatingChange={(rating) => handleRatingChange(category.key, rating)}
                />
              </div>
            ))}
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <Label htmlFor="review-text">
              Share your experience (optional)
            </Label>
            <Textarea
              id="review-text"
              placeholder="Tell us about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              disabled={loading}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reviewText.length}/1000 characters
            </p>
          </div>

          {/* Error message */}
          {error && <div className="text-sm text-destructive text-center">{error}</div>}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || ratings.overallRating === 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
