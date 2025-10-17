'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image, Camera, X, Instagram } from 'lucide-react';
import { uploadService } from '@/lib/upload';

interface Step3ProfileMediaProps {
  defaultValues?: {
    profilePhotoUrl?: string;
    logoUrl?: string;
    coverPhotoUrl?: string;
  };
  onNext: (data: {
    profilePhotoUrl: string;
    logoUrl?: string;
    coverPhotoUrl?: string;
  }) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step3ProfileMedia({
  defaultValues,
  onNext,
  onBack,
  isLoading,
}: Step3ProfileMediaProps) {
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Existing URLs from backend
  const [existingProfileUrl, setExistingProfileUrl] = useState<string | undefined>(
    defaultValues?.profilePhotoUrl
  );
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | undefined>(
    defaultValues?.logoUrl
  );
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | undefined>(
    defaultValues?.coverPhotoUrl
  );

  useEffect(() => {
    if (defaultValues) {
      setExistingProfileUrl(defaultValues.profilePhotoUrl);
      setExistingLogoUrl(defaultValues.logoUrl);
      setExistingCoverUrl(defaultValues.coverPhotoUrl);
    }
  }, [defaultValues]);

  const handleFileUpload = (file: File | null, setter: (file: File | null) => void) => {
    if (file && file.type.startsWith('image/')) {
      setter(file);
    }
  };

  const handleInstagramConnect = () => {
    toast.info('Instagram connection will be available soon!');
  };

  const handleContinue = async () => {
    if (!profilePhoto && !existingProfileUrl) {
      toast.error('Profile photo required', {
        description: 'Please upload a profile photo to continue',
      });
      return;
    }

    try {
      setIsUploading(true);

      const profilePhotoResult = profilePhoto
        ? await uploadService.uploadFile(profilePhoto, 'profile')
        : { url: existingProfileUrl! };

      const logoResult = logo
        ? await uploadService.uploadFile(logo, 'logo')
        : existingLogoUrl
          ? { url: existingLogoUrl }
          : undefined;

      const coverPhotoResult = coverPhoto
        ? await uploadService.uploadFile(coverPhoto, 'cover')
        : existingCoverUrl
          ? { url: existingCoverUrl }
          : undefined;

      await onNext({
        profilePhotoUrl: profilePhotoResult.url,
        logoUrl: logoResult?.url,
        coverPhotoUrl: coverPhotoResult?.url,
      });
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast.error('Upload failed', {
        description: error.message || 'Failed to upload media. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Profile Media</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload photos to showcase your work and build trust with clients
        </p>
      </div>

      <div className="space-y-6 w-full">
        {/* Profile Photo */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Photo *
            </CardTitle>
            <CardDescription>
              This will be your main profile picture visible to clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img
                    src={URL.createObjectURL(profilePhoto)}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : existingProfileUrl ? (
                  <img
                    src={existingProfileUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1">
                <Label htmlFor="profile-photo" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {profilePhoto || existingProfileUrl
                        ? 'Change profile photo'
                        : 'Upload profile photo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </Label>
                <Input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setProfilePhoto)}
                />

                {(profilePhoto || existingProfileUrl) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProfilePhoto(null);
                      setExistingProfileUrl(undefined);
                    }}
                    className="mt-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Business Logo
            </CardTitle>
            <CardDescription>Your business logo (optional but recommended)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {logo ? (
                  <img
                    src={URL.createObjectURL(logo)}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : existingLogoUrl ? (
                  <img src={existingLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Image className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1">
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {logo || existingLogoUrl ? 'Change logo' : 'Upload logo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setLogo)}
                />

                {(logo || existingLogoUrl) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogo(null);
                      setExistingLogoUrl(undefined);
                    }}
                    className="mt-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Cover Photo
            </CardTitle>
            <CardDescription>A banner image for your profile (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-16 w-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {coverPhoto ? (
                  <img
                    src={URL.createObjectURL(coverPhoto)}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : existingCoverUrl ? (
                  <img src={existingCoverUrl} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <Image className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1">
                <Label htmlFor="cover-photo" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {coverPhoto || existingCoverUrl ? 'Change cover photo' : 'Upload cover photo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </Label>
                <Input
                  id="cover-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null, setCoverPhoto)}
                />

                {(coverPhoto || existingCoverUrl) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCoverPhoto(null);
                      setExistingCoverUrl(undefined);
                    }}
                    className="mt-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instagram Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Instagram Integration
            </CardTitle>
            <CardDescription>
              Connect your Instagram to showcase your work and import photos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connect Instagram Account</p>
                <p className="text-sm text-muted-foreground">
                  Import photos from your Instagram profile to showcase your work
                </p>
              </div>

              <Button variant="default" onClick={handleInstagramConnect} className="gap-2">
                <Instagram className="h-4 w-4" />
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-6 w-full">
        <Button variant="outline" onClick={onBack} className="gap-2">
          Back
        </Button>

        <Button
          onClick={handleContinue}
          disabled={(!profilePhoto && !existingProfileUrl) || isUploading || isLoading}
          className="gap-2"
        >
          {isUploading || isLoading ? 'Uploading...' : 'Continue'}
        </Button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          You can always update these photos later in your profile settings
        </p>
      </div>
    </div>
  );
}
