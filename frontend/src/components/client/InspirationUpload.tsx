'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Image as ImageIcon, AlertCircle, Loader2, X, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { ImageAnalysisResult } from '@/shared-types/inspiration.types';

interface InspirationUploadProps {
  onMatchesFound?: (analysis: ImageAnalysisResult) => void;
}

export function InspirationUpload({ onMatchesFound }: InspirationUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setAnalysis(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setError(null);
    setUploading(true);
    setAnalyzing(false);

    try {
      // Step 1: Upload file to temporary storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload?type=inspiration`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.data.file.url;

      setUploading(false);
      setAnalyzing(true);

      // Step 2: Analyze with AI (ephemeral - no storage)
      const { data } = await api.inspiration.analyze({
        imageUrl,
      });

      setAnalysis(data.analysis);
      setAnalyzing(false);

      toast.success('Image analyzed successfully!');

      // Step 3: Trigger matches search
      if (onMatchesFound) {
        onMatchesFound(data.analysis);
      }
    } catch (err) {
      console.error('Upload/analysis error:', err);
      setError(extractErrorMessage(err) || 'Failed to analyze image');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const isProcessing = uploading || analyzing;

  return (
    <Card className="w-full shadow-lg border-primary/20 bg-background/80 backdrop-blur">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Upload Your Inspiration</CardTitle>
              <CardDescription className="text-sm">
                Drag & drop or click to browse
              </CardDescription>
            </div>
          </div>
          {previewUrl && !isProcessing && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Area */}
        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Icon */}
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ImageIcon className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center border-2 border-background">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Text */}
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              Drop your inspiration photo here
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload a clear photo of the hairstyle, makeup, or nail design you want to recreate
            </p>

            {/* File Info */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>PNG, JPG, WebP up to 10MB</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview Container - Fixed Height */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 h-[400px] flex items-center justify-center border border-primary/20">
              <Image
                src={previewUrl}
                alt="Inspiration preview"
                width={800}
                height={400}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                    </div>
                    <p className="font-medium text-lg mb-1">
                      {uploading ? 'Uploading...' : 'Analyzing with AI...'}
                    </p>
                    <p className="text-sm text-muted-foreground">Please wait</p>
                  </div>
                </div>
              )}

              {/* Success Badge */}
              {analysis && !isProcessing && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/90 text-white text-sm font-medium backdrop-blur">
                    <Check className="h-4 w-4" />
                    Analyzed
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={uploading ? 40 : 80} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {uploading && 'Uploading your photo...'}
                  {analyzing && 'AI is analyzing style features...'}
                </p>
              </div>
            )}

            {/* Analysis Results Mini Preview */}
            {analysis && !isProcessing && (
              <Alert className="border-primary/30 bg-primary/5">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm mb-1">✨ AI Analysis Complete!</p>
                      <p className="text-xs text-muted-foreground">
                        Detected {analysis.tags?.length || 0} style features
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {analysis.tags?.slice(0, 3).join(', ')}...
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={isProcessing || !!analysis}
                className="flex-1 h-12 text-base gap-2"
                size="lg"
                variant="dark"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {uploading ? 'Uploading...' : 'Analyzing...'}
                  </>
                ) : analysis ? (
                  <>
                    <Check className="h-5 w-5" />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Find Matches
                  </>
                )}
              </Button>
              
              {!isProcessing && (
                <Button variant="outline" onClick={handleClear} size="lg" className="h-12">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-sm space-y-2">
              <p className="font-medium text-foreground">How Visual Search Works:</p>
              <ul className="text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Upload a clear photo showing the style you want</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>AI analyzes colors, techniques, and style details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Get matched with professionals who've done similar work</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
