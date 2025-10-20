'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Search as SearchIcon, Sliders } from 'lucide-react';
import { InspirationUpload } from '@/components/client/InspirationUpload';
import { ServiceGrid } from '@/components/search/ServiceGrid';
import Header from '@/components/shared/Header';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { ROUTES } from '@/constants';
import type {
  InspirationMatch,
  ImageAnalysisResult,
  SearchMode,
} from '@/shared-types/inspiration.types';
import type { PublicServiceResult } from '@/shared-types/service.types';

export default function VisualSearchPage() {
  const [matches, setMatches] = useState<InspirationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<ImageAnalysisResult | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('balanced');

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
        searchMode: searchMode, // Include selected search mode
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
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-8 relative">
          {/* Compact Header */}
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Visual Search</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
              Find Your Perfect Look
            </h1>

            <p className="text-base text-muted-foreground mb-4 max-w-xl mx-auto">
              Upload a photo and let AI match you with professionals who can recreate it
            </p>

            <Button size="sm" variant="outline" asChild className="gap-2">
              <Link href={ROUTES.SEARCH}>
                <SearchIcon className="h-3.5 w-3.5" />
                Try Text Search
              </Link>
            </Button>
          </div>

          {/* Upload Section - Main Focus */}
          <div className="max-w-4xl mx-auto mb-8">
            <InspirationUpload onMatchesFound={handleInspirationAnalyzed} />
          </div>

          {/* Analysis Results Display */}
          {analysisData && !loading && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle>AI Visual Analysis</CardTitle>
                  </div>
                  <CardDescription>
                    {analysisData.tags.length} comprehensive features detected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Natural Language Description */}
                  {analysisData.description && (
                    <div className="bg-background/60 rounded-lg p-4 border border-primary/10">
                      <h4 className="text-sm font-semibold text-primary mb-2">
                        Professional Analysis
                      </h4>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {analysisData.description}
                      </p>
                    </div>
                  )}

                  {/* Comprehensive Tags */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <span>Detected Features</span>
                      <Badge variant="secondary" className="text-xs">
                        {analysisData.tags.length} tags
                      </Badge>
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {analysisData.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="px-2 py-1 text-xs bg-accent/10 border-accent/20 hover:bg-accent/20 transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Search Mode Selector */}
                  <div className="pt-4 border-t border-primary/10">
                    <div className="flex items-center gap-3">
                      <Sliders className="h-4 w-4 text-primary" />
                      <label className="text-sm font-semibold">Search Mode:</label>
                      <Select
                        value={searchMode}
                        onValueChange={(value) => {
                          setSearchMode(value as SearchMode);
                          if (analysisData) {
                            findMatches(analysisData); // Re-search with new mode
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="visual">Visual Focus</SelectItem>
                          <SelectItem value="style">Style Focus</SelectItem>
                          <SelectItem value="semantic">Description Match</SelectItem>
                          <SelectItem value="color">Color Match</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">
                        {searchMode === 'balanced' && 'Best overall matches'}
                        {searchMode === 'visual' && 'Prioritize visual appearance'}
                        {searchMode === 'style' && 'Prioritize techniques & styles'}
                        {searchMode === 'semantic' && 'Prioritize descriptions'}
                        {searchMode === 'color' && 'Prioritize color palette'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="border-primary/20">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Finding Your Perfect Matches</h3>
                    <p className="text-muted-foreground mb-4">
                      Our AI is analyzing thousands of professional portfolios...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span>This typically takes 5-10 seconds</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="max-w-4xl mx-auto mb-8">
              <Alert variant="destructive" className="border-destructive/50">
                <AlertDescription className="text-center py-4">{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Results Section */}
        {matches.length > 0 && !loading && (
          <div className="bg-background/50 backdrop-blur py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                {/* Results Header */}
                <div className="text-center mb-8">
                  <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm">
                    {matches.length} Professional{matches.length !== 1 ? 's' : ''} Found
                  </Badge>
                </div>

                {/* Service Grid */}
                <ServiceGrid services={servicesFromMatches} />

                {/* Bottom CTA */}
                <div className="text-center mt-12">
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 max-w-2xl mx-auto">
                    <CardContent className="py-8">
                      <h3 className="text-xl font-semibold mb-2">
                        Didn't find what you're looking for?
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Try uploading a different photo or browse all services
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                          Upload New Photo
                        </Button>
                        <Button variant="default" asChild>
                          <Link href={ROUTES.SEARCH}>Browse All Services</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
