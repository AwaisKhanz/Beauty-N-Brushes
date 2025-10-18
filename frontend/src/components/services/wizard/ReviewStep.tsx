'use client';

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Edit,
  Check,
  Star,
  Clock,
  Image as ImageIcon,
  Tag,
  Settings,
  AlertCircle,
  Globe,
  Save,
  Send,
} from 'lucide-react';
import Image from 'next/image';
import { ServiceWizardData } from '../ServiceCreationWizard';
import { SERVICE_CATEGORIES } from '@/constants';

interface ReviewStepProps {
  form: UseFormReturn<ServiceWizardData>;
  onNext: () => void;
  isEdit?: boolean;
}

export function ReviewStep({ form, onNext, isEdit }: ReviewStepProps) {
  const [publishAsActive, setPublishAsActive] = useState(true);
  const [acceptNewClients, setAcceptNewClients] = useState(true);

  const formData = form.getValues();
  const category = SERVICE_CATEGORIES.find((c) => c.id === formData.category);
  const featuredMedia = formData.media?.find((m) => m.isFeatured);
  const totalAddonsPrice =
    formData.addons?.reduce((sum, addon) => sum + (addon.price || 0), 0) || 0;

  const getStepEditHandler = (_step: string) => {
    return () => {
      // Edit functionality would be handled by parent wizard component
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review Your Service</h2>
        <p className="text-muted-foreground">
          Review all details before {isEdit ? 'updating' : 'publishing'} your service
        </p>
      </div>

      {/* Service Preview Card */}
      <Card className="overflow-hidden">
        <div className="relative">
          {featuredMedia ? (
            <div className="aspect-video relative">
              <Image src={featuredMedia.url} alt={formData.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">{formData.title}</h3>
                <p className="text-sm opacity-90">{category?.name}</p>
              </div>
              <Badge className="absolute top-4 right-4 bg-white text-black">Preview</Badge>
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p>No featured image</p>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{formData.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {category?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formData.durationMinutes} minutes
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{formData.description}</p>
              </div>

              {/* Hashtags */}
              {formData.hashtags && formData.hashtags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Hashtags</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.hashtags.map((hashtag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {formData.media && formData.media.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Gallery ({formData.media.length} items)</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {formData.media.slice(0, 8).map((media, index) => (
                      <div key={index} className="aspect-square relative rounded overflow-hidden">
                        <Image
                          src={media.thumbnailUrl || media.url}
                          alt={`Media ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {media.isFeatured && (
                          <Star className="absolute top-1 right-1 h-3 w-3 text-warning fill-current" />
                        )}
                      </div>
                    ))}
                    {formData.media.length > 8 && (
                      <div className="aspect-square bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        +{formData.media.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      ${formData.priceMin}
                      {formData.priceType === 'range' && formData.priceMax && (
                        <span> - ${formData.priceMax}</span>
                      )}
                      {formData.priceType === 'starting_at' && (
                        <span className="text-sm font-normal text-muted-foreground"> starting</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {formData.priceType.replace('_', ' ')} price
                    </p>
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{formData.durationMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposit:</span>
                      <span>
                        {formData.depositType === 'percentage'
                          ? `${formData.depositAmount}%`
                          : `$${formData.depositAmount}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add-ons */}
              {formData.addons && formData.addons.length > 0 && (
                <Card>
                  <CardHeader>
                    <h4 className="font-medium">Add-ons Available</h4>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {formData.addons.slice(0, 3).map((addon, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{addon.name}</span>
                          <span>+${addon.price}</span>
                        </div>
                      ))}
                      {formData.addons.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{formData.addons.length - 3} more add-ons
                        </div>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total with all add-ons:</span>
                      <span>${(formData.priceMin + totalAddonsPrice).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Basic Information</CardTitle>
            <Button variant="ghost" size="sm" onClick={getStepEditHandler('basic')}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Title:</span>
                <p className="font-medium">{formData.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <p className="font-medium">{category?.name}</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Description:</span>
              <p className="text-sm mt-1">{formData.description?.substring(0, 100)}...</p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pricing & Duration</CardTitle>
            <Button variant="ghost" size="sm" onClick={getStepEditHandler('pricing')}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Price:</span>
                <p className="font-medium">
                  ${formData.priceMin}
                  {formData.priceType === 'range' &&
                    formData.priceMax &&
                    ` - $${formData.priceMax}`}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <p className="font-medium">{formData.durationMinutes} minutes</p>
              </div>
              <div>
                <span className="text-muted-foreground">Deposit:</span>
                <p className="font-medium">
                  {formData.depositType === 'percentage'
                    ? `${formData.depositAmount}%`
                    : `$${formData.depositAmount}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Photos & Videos</CardTitle>
            <Button variant="ghost" size="sm" onClick={getStepEditHandler('media')}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total media files:</span>
              <span className="font-medium">{formData.media?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Featured image:</span>
              <span className="font-medium">{featuredMedia ? 'Set' : 'None'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Add-ons & Variations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Add-ons & Variations</CardTitle>
            <Button variant="ghost" size="sm" onClick={getStepEditHandler('addons')}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Add-ons:</span>
              <span className="font-medium">{formData.addons?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Variations:</span>
              <span className="font-medium">{formData.variations?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Publishing Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publish-active" className="font-medium">
                Publish as Active
              </Label>
              <p className="text-sm text-muted-foreground">
                Service will be visible to clients and bookable immediately
              </p>
            </div>
            <Switch
              id="publish-active"
              checked={publishAsActive}
              onCheckedChange={setPublishAsActive}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="accept-clients" className="font-medium">
                Accept New Clients
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow new clients to book this service
              </p>
            </div>
            <Switch
              id="accept-clients"
              checked={acceptNewClients}
              onCheckedChange={setAcceptNewClients}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Warnings */}
      {(!formData.media || formData.media.length === 0) && (
        <Card className="border-warning/20 bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-warning-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">No media uploaded</span>
            </div>
            <p className="text-sm text-warning-foreground mt-1">
              Services with photos get 10x more bookings. Consider adding at least one image.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            setPublishAsActive(false);
            onNext();
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="min-w-[200px]">
              {isEdit ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Update Service
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Service
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isEdit ? 'Update Service?' : 'Publish Service?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isEdit ? (
                  'Are you sure you want to update this service? Changes will be visible to clients immediately.'
                ) : (
                  <>
                    Your service "{formData.title}" will be published and visible to clients.
                    {publishAsActive && ' It will be immediately available for booking.'}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onNext}>
                {isEdit ? 'Update' : 'Publish'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Success Preview */}
      <Card className="bg-success/10 border-success/20">
        <CardContent className="p-4">
          <h4 className="font-medium text-success-foreground mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            After Publishing
          </h4>
          <ul className="text-sm text-success-foreground space-y-1">
            <li>• Your service will appear in search results</li>
            <li>• Clients can view details and book appointments</li>
            <li>• You can edit or deactivate it anytime</li>
            <li>• Track views and bookings in your dashboard</li>
            {publishAsActive && <li>• Clients can book immediately</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
