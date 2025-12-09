'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface BookingReviewProps {
  review: {
    id: string;
    overallRating: number;
    qualityRating?: number | null;
    timelinessRating?: number | null;
    professionalismRating?: number | null;
    reviewText: string | null;
    createdAt: string;
  };
}

export function BookingReview({ review }: BookingReviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const RatingDisplay = ({ rating, label }: { rating: number; label: string }) => (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-rating-filled text-rating-filled'
                : 'fill-none text-muted-foreground'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-rating-filled" />
          Your Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Rating - Prominent Display */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Overall Rating</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= review.overallRating
                      ? 'fill-rating-filled text-rating-filled'
                      : 'fill-none text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold">{review.overallRating}/5</span>
          </div>
        </div>

        {/* Detailed Ratings */}
        {(review.qualityRating || review.timelinessRating || review.professionalismRating) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {review.qualityRating && (
              <RatingDisplay rating={review.qualityRating} label="Quality" />
            )}
            {review.timelinessRating && (
              <RatingDisplay rating={review.timelinessRating} label="Timeliness" />
            )}
            {review.professionalismRating && (
              <RatingDisplay rating={review.professionalismRating} label="Professionalism" />
            )}
          </div>
        )}

        {/* Review Text */}
        {review.reviewText && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Review</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {review.reviewText}
            </p>
          </div>
        )}

        {/* Review Date */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Reviewed on {formatDate(review.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
