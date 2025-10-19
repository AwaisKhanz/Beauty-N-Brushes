'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, MapPin, DollarSign, Star } from 'lucide-react';
import { InspirationUpload } from '@/components/client/InspirationUpload';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { InspirationMatch } from '../../../../../shared-types';

export default function VisualSearchPage() {
  const router = useRouter();
  const [inspirationId, setInspirationId] = useState<string | null>(null);
  const [matches, setMatches] = useState<InspirationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleInspirationUploaded = async (uploadedInspirationId: string, analysis: any) => {
    console.log('Inspiration uploaded:', uploadedInspirationId);
    console.log('Analysis:', analysis);

    setInspirationId(uploadedInspirationId);
    setAnalysisData(analysis);
    setError(null);

    // Automatically find matches
    await findMatches(uploadedInspirationId);
  };

  const findMatches = async (inspId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.inspiration.match(inspId, {
        maxResults: 20,
      });

      console.log('Matches found:', response.data.matches);
      setMatches(response.data.matches || []);

      if (response.data.matches?.length === 0) {
        setError(
          'No matches found. Try uploading a different style photo or check back later when more providers are available.'
        );
      }
    } catch (err: unknown) {
      console.error('Error finding matches:', err);
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
          <InspirationUpload onMatchesFound={handleInspirationUploaded} />
        </div>

        {/* Analysis Results */}
        {analysisData && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="bg-info/10 border-info/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-info" />
                  AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisData.tags && analysisData.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">AI Detected Style Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.tags.slice(0, 10).map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">Finding Your Perfect Match...</h3>
                  <p className="text-muted-foreground">
                    Analyzing thousands of portfolio images using AI vector similarity
                  </p>
                  <Progress value={60} className="w-64 mx-auto" />
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

        {/* Matches Results */}
        {matches.length > 0 && !loading && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {matches.length} Matching {matches.length === 1 ? 'Service' : 'Services'} Found
              </h2>
              <p className="text-muted-foreground">Ranked by AI similarity - Best matches first</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Card
                  key={match.mediaId}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/@${match.providerSlug}/${match.serviceId}`)}
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={match.thumbnailUrl || match.mediaUrl}
                      alt={match.serviceTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Match Score Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-success text-success-foreground shadow-lg">
                        <Star className="h-3 w-3 mr-1" />
                        {match.matchScore}% Match
                      </Badge>
                    </div>

                    {/* Distance Score (Debug) */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="text-xs">
                        Distance: {match.distance.toFixed(3)}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-1">{match.serviceTitle}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {match.providerLogoUrl && (
                        <Image
                          src={match.providerLogoUrl}
                          alt={match.providerBusinessName}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      )}
                      {match.providerBusinessName}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {match.providerCity}, {match.providerState}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        Starting at ${match.servicePriceMin}
                      </span>
                    </div>

                    {/* Matching Tags */}
                    {match.matchingTags && match.matchingTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {match.matchingTags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* View Button */}
                    <Button className="w-full bg-button-dark hover:bg-button-dark/90" size="sm">
                      View Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Try New Search */}
            <div className="text-center mt-12">
              <Button
                variant="outline"
                onClick={() => {
                  setInspirationId(null);
                  setMatches([]);
                  setAnalysisData(null);
                }}
              >
                Try Another Photo
              </Button>
            </div>
          </div>
        )}

        {/* Empty State - No Results Yet */}
        {!loading && !error && matches.length === 0 && !inspirationId && (
          <div className="max-w-4xl mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload Your Inspiration</h3>
                <p className="text-muted-foreground">
                  Upload a photo above to see matching services powered by AI
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
