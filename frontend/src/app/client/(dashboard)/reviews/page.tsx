'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Star, Search } from 'lucide-react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import Link from 'next/link';
import type { ReviewWithRelations } from '../../../../../../shared-types';

export default function ClientReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      setLoading(true);
      setError('');

      const res = await api.reviews.getMyReviews();
      setReviews(res.data.reviews);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <ReviewsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">My Reviews</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">My Reviews</h1>
        <p className="text-muted-foreground">Reviews you've left for providers</p>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} canEdit={true} />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-12">
          <Star className="h-16 w-16 mx-auto mb-4 opacity-50 text-rating-filled" />
          <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Complete a booking to leave your first review and help others discover great beauty
            professionals
          </p>
          <Button asChild>
            <Link href="/search">
              <Search className="h-4 w-4 mr-2" />
              Browse Services
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
