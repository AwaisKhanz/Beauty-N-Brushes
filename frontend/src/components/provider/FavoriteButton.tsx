'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  providerId: string;
  initialIsFavorited?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({
  providerId,
  initialIsFavorited = false,
  variant = 'outline',
  size = 'icon',
  showText = false,
  className,
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation(); // Prevent event bubbling

    try {
      setLoading(true);
      const response = await api.favorites.toggle(providerId);
      const newFavoritedState = response.data.isFavorited;
      
      setIsFavorited(newFavoritedState);
      onToggle?.(newFavoritedState);

      toast.success(
        newFavoritedState ? 'Added to favorites' : 'Removed from favorites'
      );
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to update favorites';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'transition-all',
        isFavorited && 'border-primary text-primary',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4',
          showText && 'mr-2',
          isFavorited && 'fill-current'
        )}
      />
      {showText && (
        <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
      )}
      {!showText && <span className="sr-only">Toggle favorite</span>}
    </Button>
  );
}
