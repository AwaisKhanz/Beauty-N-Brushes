'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Instagram, Loader2, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { InstagramMedia, ImportedMedia } from '@/shared-types/instagram.types';
import { toast } from 'sonner';
import Image from 'next/image';

interface InstagramMediaImportProps {
  onImportComplete?: () => void;
}

export function InstagramMediaImport({ onImportComplete }: InstagramMediaImportProps) {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [fetchingMedia, setFetchingMedia] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [instagramMedia, setInstagramMedia] = useState<InstagramMedia[]>([]);
  const [importedMedia, setImportedMedia] = useState<ImportedMedia[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  useEffect(() => {
    loadImportedMedia();
  }, []);

  async function loadImportedMedia() {
    try {
      setLoading(true);
      const response = await api.instagram.getImported();
      setImportedMedia(response.data.media);
    } catch (error: unknown) {
      // Silent fail - user might not have connected Instagram yet
      console.error('Failed to load imported media:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true);
      const response = await api.instagram.connect();

      // Redirect to Instagram OAuth
      window.location.href = response.data.authUrl;
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to connect Instagram';
      toast.error('Connection Failed', {
        description: message,
      });
      setConnecting(false);
    }
  }

  async function fetchInstagramMedia() {
    try {
      setFetchingMedia(true);
      const response = await api.instagram.getMedia();
      setInstagramMedia(response.data.media);
      setShowImportDialog(true);
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to fetch Instagram media';
      toast.error('Fetch Failed', {
        description: message,
      });
    } finally {
      setFetchingMedia(false);
    }
  }

  async function handleImportSelected() {
    if (selectedMediaIds.length === 0) {
      toast.error('No media selected');
      return;
    }

    try {
      setImporting(true);
      await api.instagram.import({ mediaIds: selectedMediaIds });

      toast.success('Media imported successfully', {
        description: `${selectedMediaIds.length} items imported`,
      });

      setShowImportDialog(false);
      setSelectedMediaIds([]);
      await loadImportedMedia();

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to import media';
      toast.error('Import Failed', {
        description: message,
      });
    } finally {
      setImporting(false);
    }
  }

  function toggleMediaSelection(mediaId: string) {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasConnection = importedMedia.length > 0 || connecting;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Instagram Portfolio
              </CardTitle>
              <CardDescription>
                Connect your Instagram to import and showcase your work
              </CardDescription>
            </div>
            {!hasConnection ? (
              <Button onClick={handleConnect} disabled={connecting} className="gap-2">
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Instagram className="h-4 w-4" />
                    Connect Instagram
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={fetchInstagramMedia}
                disabled={fetchingMedia}
                variant="outline"
                className="gap-2"
              >
                {fetchingMedia ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Import More'
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {importedMedia.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {importedMedia.length} media items imported
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {importedMedia.slice(0, 8).map((media) => (
                  <div key={media.id} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={media.thumbnailUrl || media.mediaUrl}
                        alt={media.caption || 'Instagram media'}
                        fill
                        className="object-cover"
                      />
                      {media.linkedToServiceId && (
                        <div className="absolute top-2 right-2 bg-success/90 text-white p-1 rounded-full">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    {media.service && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        {media.service.title}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Instagram className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No Instagram media imported yet</p>
              <p className="text-xs mt-1">Connect your Instagram to showcase your work</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Instagram Media</DialogTitle>
            <DialogDescription>
              Select photos and videos to import to your portfolio
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              {instagramMedia.map((media) => (
                <div
                  key={media.id}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedMediaIds.includes(media.id)
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-primary/50'
                  }`}
                  onClick={() => toggleMediaSelection(media.id)}
                >
                  <Image
                    src={media.thumbnail_url || media.media_url}
                    alt={media.caption || 'Instagram media'}
                    fill
                    className="object-cover"
                  />
                  {selectedMediaIds.includes(media.id) && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-1">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={selectedMediaIds.includes(media.id)}
                      onCheckedChange={() => toggleMediaSelection(media.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {media.media_type === 'VIDEO' && (
                    <Badge className="absolute bottom-2 left-2" variant="secondary">
                      VIDEO
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">{selectedMediaIds.length} selected</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImportSelected}
                disabled={selectedMediaIds.length === 0 || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import Selected ({selectedMediaIds.length})</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
