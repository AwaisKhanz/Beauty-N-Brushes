'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Search as SearchIcon } from 'lucide-react';
import { InspirationUpload } from '@/components/client/InspirationUpload';
import { ServiceGrid } from '@/components/search/ServiceGrid';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { ROUTES } from '@/constants';
import type { InspirationMatch, ImageAnalysisResult } from '@/shared-types/inspiration.types';
import type { PublicServiceResult } from '@/shared-types/service.types';

export default function VisualSearchPage() {
  const [matches, setMatches] = useState<InspirationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<ImageAnalysisResult | null>(null);

  const handleInspirationAnalyzed = async (analysis: ImageAnalysisResult) => {
    setAnalysisData(analysis);
    setError(null);

    // Automatically find matches using the embedding
    await findMatches(analysis);
  };

  const findMatches = async (analysis: ImageAnalysisResult) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.inspiration.match({
        embedding: analysis.embedding,
        tags: analysis.tags,
        maxResults: 20,
      });

      setMatches(response.data.matches || []);

      if (response.data.matches?.length === 0) {
        setError(
          'No matches found. Try uploading a different style photo or check back later when more providers are available.'
        );
      }
    } catch (err: unknown) {
      console.error('❌ Error finding matches:', err);
      setError(extractErrorMessage(err) || 'Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert matches to PublicServiceResult format for ServiceGrid
  const servicesFromMatches: PublicServiceResult[] = matches.map((match) => ({
    id: match.serviceId,
    title: match.serviceTitle,
    description: '', // Not provided in match
    priceMin: match.servicePriceMin,
    priceMax: null,
    priceType: 'starting_at',
    currency: match.serviceCurrency,
    durationMinutes: 60, // Default, not provided
    category: '', // Not provided
    subcategory: null,
    featuredImageUrl: match.mediaUrl,
    providerId: match.providerId,
    providerName: match.providerBusinessName,
    providerSlug: match.providerSlug,
    providerLogoUrl: null,
    providerCity: match.providerCity,
    providerState: match.providerState,
    providerRating: 5.0, // Default, not provided
    providerReviewCount: 0,
    providerIsSalon: false,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-heading font-bold text-foreground">
              AI-Powered Visual Search
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Upload a photo of your dream hairstyle and our AI will find beauty professionals who can
            recreate the look
          </p>
          <Link href={ROUTES.SEARCH}>
            <Button variant="outline" size="sm">
              <SearchIcon className="h-4 w-4 mr-2" />
              Try Text Search Instead
            </Button>
          </Link>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <InspirationUpload onMatchesFound={handleInspirationAnalyzed} />
        </div>

        {/* Analysis Tags */}
        {analysisData && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detected Style Features</CardTitle>
                <CardDescription>
                  Our AI identified these characteristics in your inspiration photo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisData.tags.slice(0, 15).map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-lg font-medium">Finding perfect matches for you...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analyzing thousands of portfolios with AI
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Matches */}
        {matches.length > 0 && !loading && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                {matches.length} Matching Professionals Found
              </h2>
              <p className="text-muted-foreground">
                Sorted by similarity to your inspiration photo
              </p>
            </div>

            {/* Use ServiceGrid for consistent display */}
            <ServiceGrid services={servicesFromMatches} />
          </div>
        )}
      </div>
    </div>
  );
}
