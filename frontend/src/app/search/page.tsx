import { Suspense } from 'react';
import { SearchContent } from './SearchContent';
import { Skeleton } from '@/components/ui/skeleton';

function SearchFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Skeleton className="h-96 w-full" />
          </aside>
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
