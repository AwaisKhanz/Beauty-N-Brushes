'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';

export interface LightboxImage {
  id?: string;
  url: string;
  alt?: string;
}

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImage[];
  startIndex?: number;
  title?: string;
  showThumbnails?: boolean;
  maxThumbnails?: number;
}

export function ImageLightbox({
  open,
  onOpenChange,
  images,
  startIndex = 0,
  title: _title,
  showThumbnails = false,
  maxThumbnails = 20,
}: ImageLightboxProps) {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined);
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (!api) return;
    api.scrollTo(startIndex, true);
    const onSelect = () => setIndex(api.selectedScrollSnap());
    setIndex(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, startIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        api?.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        api?.scrollNext();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, api, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" !h-[80vh] !w-[80vw] max-w-full border-none bg-background p-10 rounded-xl">
        <div className="h-full">
          <Carousel setApi={setApi} opts={{ align: 'start', loop: true }} className="!h-full">
            <CarouselContent className="-ml-4 !h-full">
              {images.map((img, i) => (
                <CarouselItem key={img.id || i} className="pl-4 !h-full">
                  <div className="relative !h-full rounded-none  bg-background">
                    <Image
                      src={img.url}
                      alt={img.alt || 'image'}
                      fill
                      className="object-contain !h-full"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur" />
            <CarouselNext className="right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur" />
          </Carousel>

          {showThumbnails && images.length > 1 && (
            <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {images.slice(0, maxThumbnails).map((img, i) => (
                <button
                  key={img.id || `lb-${i}`}
                  className={`relative aspect-video rounded-md overflow-hidden ring-1 transition ${
                    index === i ? 'ring-primary' : 'ring-border'
                  }`}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || 'thumb'}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
