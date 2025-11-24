'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, CheckCircle2, Share2, Download, Facebook, Twitter, Linkedin } from 'lucide-react';
import { generateQRCodeUrl, generateShareUrl, copyBookingPageUrl } from '@/lib/branding-utils';
import { toast } from 'sonner';

interface ShareBookingPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  slug: string;
}

export function ShareBookingPageDialog({
  open,
  onOpenChange,
  businessName,
  slug,
}: ShareBookingPageDialogProps) {
  const [copied, setCopied] = useState(false);

  const bookingPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://beautynbrushes.com'}/providers/${slug}`;
  const qrCodeUrl = generateQRCodeUrl(bookingPageUrl, 512);

  async function handleCopyUrl() {
    const success = await copyBookingPageUrl(bookingPageUrl);
    if (success) {
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy URL');
    }
  }

  function handleSocialShare(platform: 'facebook' | 'twitter' | 'linkedin') {
    const shareText = `Book an appointment with ${businessName} on Beauty N Brushes`;
    const shareUrl = generateShareUrl(platform, bookingPageUrl, shareText);
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  function handleDownloadQR() {
    // Create a temporary link to download the QR code
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Booking Page
          </DialogTitle>
          <DialogDescription>
            Share your unique booking link with clients. They can book directly without searching
            the marketplace.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Direct Link</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="social">Social Share</TabsTrigger>
          </TabsList>

          {/* Direct Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Your Booking Page URL</Label>
              <div className="flex gap-2">
                <Input value={bookingPageUrl} readOnly className="flex-1" />
                <Button onClick={handleCopyUrl} className="gap-2">
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link on your website, social media, or email signature
              </p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Pro Tip:</strong> Add this link to your Instagram bio, website, or
                  business cards for easy booking access
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-64 h-64 rounded-lg overflow-hidden border-4 border-primary/20 bg-white p-4">
                <Image src={qrCodeUrl} alt="QR Code" fill className="object-contain p-2" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Scan to Book with {businessName}</p>
                <p className="text-xs text-muted-foreground">
                  Display this QR code in your salon or on printed materials
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownloadQR} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download QR Code
                </Button>
                <Button variant="outline" onClick={handleCopyUrl} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Social Share Tab */}
          <TabsContent value="social" className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Share your booking page on social media to attract new clients
              </p>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSocialShare('facebook')}
                  className="gap-2 justify-start h-auto py-4"
                >
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Facebook className="h-5 w-5 text-info" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Share on Facebook</p>
                    <p className="text-xs text-muted-foreground">
                      Post to your Facebook page or profile
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSocialShare('twitter')}
                  className="gap-2 justify-start h-auto py-4"
                >
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Twitter className="h-5 w-5 text-info" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Share on Twitter</p>
                    <p className="text-xs text-muted-foreground">Tweet your booking link</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSocialShare('linkedin')}
                  className="gap-2 justify-start h-auto py-4"
                >
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Linkedin className="h-5 w-5 text-info" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Share on LinkedIn</p>
                    <p className="text-xs text-muted-foreground">
                      Share with your professional network
                    </p>
                  </div>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
