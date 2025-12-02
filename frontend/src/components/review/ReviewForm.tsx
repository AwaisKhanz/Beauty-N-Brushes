'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

interface ReviewFormProps {
  bookingId: string;
  serviceTitle: string;
  providerName: string;
  onSuccess: () => void;
}

export function ReviewForm({ bookingId, serviceTitle, providerName, onSuccess }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      setError('Please select an overall rating');
      return;
    }

    if (reviewText.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.reviews.create({
        bookingId,
        overallRating,
        qualityRating: qualityRating || undefined,
        timelinessRating: timelinessRating || undefined,
        professionalismRating: professionalismRating || undefined,
        reviewText: reviewText.trim(),
      });

      toast.success('Review submitted successfully!', {
        description: 'Thank you for sharing your experience',
      });

      onSuccess();
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to submit review';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Info */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="font-medium">{serviceTitle}</p>
        <p className="text-sm text-muted-foreground">{providerName}</p>
      </div>

      {/* Overall Rating */}
      <div className="space-y-2">
        <Label className="text-base">Overall Rating *</Label>
        <div className="flex items-center gap-3">
          <StarRating rating={overallRating} onRatingChange={setOverallRating} size="lg" />
          {overallRating > 0 && (
            <span className="text-sm text-muted-foreground">
              {overallRating === 1 && 'Poor'}
              {overallRating === 2 && 'Fair'}
              {overallRating === 3 && 'Good'}
              {overallRating === 4 && 'Very Good'}
              {overallRating === 5 && 'Excellent'}
            </span>
          )}
        </div>
      </div>

      {/* Detailed Ratings */}
      <div className="space-y-4 p-4 border rounded-lg">
        <p className="font-medium text-sm">Detailed Ratings (Optional)</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Quality</Label>
            <StarRating rating={qualityRating} onRatingChange={setQualityRating} />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm">Timeliness</Label>
            <StarRating rating={timelinessRating} onRatingChange={setTimelinessRating} />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm">Professionalism</Label>
            <StarRating rating={professionalismRating} onRatingChange={setProfessionalismRating} />
          </div>
        </div>
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <Label htmlFor="reviewText" className="text-base">
          Your Review *
        </Label>
        <Textarea
          id="reviewText"
          placeholder="Share details of your experience..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={6}
          maxLength={2000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {reviewText.length}/2000 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || overallRating === 0}
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
    </form>
  );
}
