'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Image as ImageIcon, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

interface InspirationUploadProps {
  onMatchesFound?: (inspirationId: string, analysis?: any) => void;
}

export function InspirationUpload({ onMatchesFound }: InspirationUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
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
      // Step 1: Upload file
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

      // Step 2: Analyze with AI
      const { data } = await api.inspiration.upload({
        imageUrl,
      });

      setAnalysis(data.analysis);
      setAnalyzing(false);

      toast.success('Image analyzed successfully!');

      // Step 3: Find matches
      if (onMatchesFound) {
        onMatchesFound(data.inspiration.id, data.analysis);
      } else {
        router.push(`/client/search?inspiration=${data.inspiration.id}`);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Find Your Look</CardTitle>
        </div>
        <CardDescription>
          Upload an inspiration photo to find beauty professionals with similar work
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Upload Your Inspiration Photo
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Click to browse or drag and drop your image here
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative rounded-lg overflow-hidden bg-muted/50">
              <Image
                src={previewUrl}
                alt="Inspiration preview"
                width={600}
                height={400}
                className="w-full h-auto object-contain"
              />
              {!isProcessing && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  {uploading && 'Uploading image...'}
                  {analyzing && 'Analyzing with AI... This may take a moment.'}
                  <Progress value={uploading ? 50 : 75} className="mt-2" />
                </AlertDescription>
              </Alert>
            )}

            {/* Analysis Results */}
            {analysis && !isProcessing && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">AI Analysis Complete!</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.styleType && <Badge variant="secondary">{analysis.styleType}</Badge>}
                    {analysis.hairType && <Badge variant="secondary">{analysis.hairType}</Badge>}
                    {analysis.complexityLevel && (
                      <Badge variant="outline">{analysis.complexityLevel}</Badge>
                    )}
                    {analysis.tags?.slice(0, 5).map((tag: string, i: number) => (
                      <Badge key={i} variant="outline">
                        {tag}
                      </Badge>
                    ))}
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

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={isProcessing} className="flex-1" size="lg">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploading ? 'Uploading...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find Matches
                  </>
                )}
              </Button>
              {!isProcessing && (
                <Button variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-4 text-sm">
          <p className="font-medium text-info-foreground mb-1">How it works:</p>
          <ol className="text-info-foreground space-y-1 list-decimal list-inside">
            <li>Upload a photo of the hairstyle or look you want</li>
            <li>Our AI analyzes the style, texture, color, and complexity</li>
            <li>We match you with local professionals who've done similar work</li>
            <li>Book your appointment with confidence!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
