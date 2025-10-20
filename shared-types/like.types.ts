/**
 * Like Types
 * Types for like system (provider and service likes)
 */

export interface ToggleLikeRequest {
  targetId: string;
  targetType: 'provider' | 'service';
}

export interface ToggleLikeResponse {
  message: string;
  liked: boolean;
  likeCount: number;
}

export interface LikeItem {
  id: string;
  targetType: 'provider' | 'service';
  targetId: string;
  targetName: string;
  targetImageUrl?: string;
  createdAt: string;
}

export interface GetLikesResponse {
  message: string;
  likes: LikeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CheckLikeStatusResponse {
  message: string;
  liked: boolean;
  likeCount: number;
}
