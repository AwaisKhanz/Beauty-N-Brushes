/**
 * Review Types
 * Types for review system (booking reviews with photos)
 */

export interface CreateReviewRequest {
  bookingId: string;
  overallRating: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  reviewText?: string;
  mediaFiles?: string[]; // URLs of uploaded images
}

export interface UpdateReviewRequest {
  reviewText?: string;
  overallRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
}

export interface ProviderResponseRequest {
  providerResponse: string;
}

export interface ReviewMedia {
  id: string;
  mediaType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl?: string;
  providerId: string;
  overallRating: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  reviewText?: string;
  providerResponse?: string;
  providerResponseDate?: string;
  isVerified: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  isHelpful?: boolean; // Current user marked as helpful
  media: ReviewMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface GetReviewsResponse {
  message: string;
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  averageRating: number;
  ratingDistribution: RatingDistribution;
}

export interface CreateReviewResponse {
  message: string;
  review: Review;
}

export interface GetReviewResponse {
  message: string;
  review: Review;
}

export interface UpdateReviewResponse {
  message: string;
  review: Review;
}

export interface DeleteReviewResponse {
  message: string;
}

export interface AddProviderResponseResponse {
  message: string;
  review: Review;
}

export interface MarkReviewHelpfulResponse {
  message: string;
  helpful: boolean;
  helpfulCount: number;
}
