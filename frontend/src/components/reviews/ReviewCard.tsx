'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Edit } from 'lucide-react';
import Link from 'next/link';

interface ReviewCardProps {
  review: {
    id: string;
    bookingId: string;
    overallRating: number;
    qualityRating?: number;
    timelinessRating?: number;
    professionalismRating?: number;
    reviewText?: string;
    photoUrls?: string[];
    providerResponse?: string;
    providerResponseDate?: string;
    createdAt: string;
    provider: {
      businessName: string;
      slug: string;
    };
    service: {
      title: string;
    };
  };
  canEdit?: boolean;
}

export function ReviewCard({ review, canEdit = false }: ReviewCardProps) {
  const isWithin24Hours = (): boolean => {
    const reviewDate = new Date(review.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const showEditButton = canEdit && isWithin24Hours();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-4">
        {/* Service & Provider Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{review.service.title}</h3>
            <Link
              href={`/providers/${review.provider.slug}`}
              className="text-sm text-primary hover:underline"
            >
              {review.provider.businessName}
            </Link>
          </div>
          {showEditButton && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/client/reviews/${review.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          )}
        </div>

        {/* Overall Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= review.overallRating
                    ? 'fill-rating-filled text-rating-filled'
                    : 'text-rating-empty'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Detailed Ratings */}
        {(review.qualityRating || review.timelinessRating || review.professionalismRating) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {review.qualityRating && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Quality:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.qualityRating!
                          ? 'fill-rating-filled text-rating-filled'
                          : 'text-rating-empty'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.timelinessRating && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Timeliness:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.timelinessRating!
                          ? 'fill-rating-filled text-rating-filled'
                          : 'text-rating-empty'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.professionalismRating && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Professionalism:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.professionalismRating!
                          ? 'fill-rating-filled text-rating-filled'
                          : 'text-rating-empty'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Text */}
        {review.reviewText && <p className="text-muted-foreground">{review.reviewText}</p>}

        {/* Photos */}
        {review.photoUrls && review.photoUrls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {review.photoUrls.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                <Image src={url} alt={`Review photo ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Provider Response */}
        {review.providerResponse && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-2 border-primary">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Provider Response
              </Badge>
              {review.providerResponseDate && (
                <span className="text-xs text-muted-foreground">
                  {new Date(review.providerResponseDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-sm">{review.providerResponse}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
