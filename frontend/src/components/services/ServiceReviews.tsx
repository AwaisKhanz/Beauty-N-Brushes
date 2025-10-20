'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, User, Calendar, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { LoginGate } from '@/components/auth/LoginGate';
interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  client: {
    name: string;
    avatarUrl?: string;
  };
}

interface ServiceReviewsProps {
  serviceId: string;
  serviceTitle: string;
}

export function ServiceReviews({ serviceId, serviceTitle }: ServiceReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.services.getReviews(serviceId);
        setReviews(response.data.reviews);
      } catch (err: unknown) {
        setError(extractErrorMessage(err) || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      loadReviews();
    }
  }, [serviceId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-heading font-bold text-foreground">Customer Reviews</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || reviews.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-heading font-bold text-foreground">Customer Reviews</h3>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">No Reviews Yet</h4>
            <p className="text-muted-foreground mb-4">
              Be the first to book this service and leave a review!
            </p>
            <LoginGate action="book this service">
              <Button variant="outline" size="sm">
                Book Now
              </Button>
            </LoginGate>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-heading font-bold text-foreground">Customer Reviews</h3>
        <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
          <Star className="h-3.5 w-3.5 fill-accent" />
          {reviews.length} reviews
        </Badge>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="border-primary/10 hover:border-primary/20 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Client Avatar */}
                <div className="flex-shrink-0">
                  {review.client.avatarUrl ? (
                    <Image
                      src={review.client.avatarUrl}
                      alt={review.client.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  {/* Client Name & Rating */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{review.client.name}</h4>
                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                  </div>

                  {/* Review Date */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(review.createdAt)}</span>
                  </div>

                  {/* Review Comment */}
                  <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length >= 10 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View All Reviews
          </Button>
        </div>
      )}
    </div>
  );
}
