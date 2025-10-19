'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, MapPin, DollarSign } from 'lucide-react';
import { InspirationUpload } from '@/components/client/InspirationUpload';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { InspirationMatch, ImageAnalysisResult } from '../../../../../shared-types';

export default function VisualSearchPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<InspirationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<ImageAnalysisResult | null>(null);

  const handleInspirationAnalyzed = async (analysis: ImageAnalysisResult) => {
    console.log('📊 Analysis received:', {
      tags: analysis.tags.slice(0, 5),
      embeddingDimensions: analysis.embedding.length,
    });

    setAnalysisData(analysis);
    setError(null);

    // Automatically find matches using the embedding
    await findMatches(analysis);
  };

  const findMatches = async (analysis: ImageAnalysisResult) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Finding matches...');
      const response = await api.inspiration.match({
        embedding: analysis.embedding,
        tags: analysis.tags,
        maxResults: 20,
      });

      console.log(`✅ Found ${response.data.matches.length} matches`);
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a photo of your dream hairstyle and our AI will find beauty professionals who can
            recreate the look
          </p>
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
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                {matches.length} Matching Professionals Found
              </h2>
              <p className="text-muted-foreground">
                Sorted by similarity to your inspiration photo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Card
                  key={match.mediaId}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/provider/${match.providerSlug}`)}
                >
                  {/* Match Score Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge
                      variant={match.matchScore >= 80 ? 'default' : 'secondary'}
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {match.matchScore}% Match
                    </Badge>
                  </div>

                  {/* Portfolio Image */}
                  <div className="relative h-64 bg-muted overflow-hidden">
                    <Image
                      src={match.thumbnailUrl || match.mediaUrl}
                      alt={match.serviceTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <CardContent className="pt-4">
                    {/* Service Title */}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {match.serviceTitle}
                    </h3>

                    {/* Provider Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {match.providerBusinessName}
                        </span>
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>
                          {match.providerCity}, {match.providerState}
                        </span>
                      </div>

                      <div className="flex items-center text-foreground font-semibold">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>
                          Starting at {match.serviceCurrency}{' '}
                          {Number(match.servicePriceMin).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Matching Tags */}
                    {match.matchingTags && match.matchingTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {match.matchingTags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <Button className="w-full mt-4" size="sm">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
