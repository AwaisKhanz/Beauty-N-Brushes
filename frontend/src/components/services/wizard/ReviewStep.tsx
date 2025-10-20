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
  Edit,
  Star,
  Clock,
  Image as ImageIcon,
  Tag,
  Settings,
  AlertCircle,
  Globe,
  DollarSign,
  Calendar,
  Users,
  Eye,
  Hourglass,
} from 'lucide-react';
import Image from 'next/image';
import { ServiceWizardData } from '../ServiceCreationWizard';
import { SERVICE_CATEGORIES } from '@/constants';

interface ReviewStepProps {
  form: UseFormReturn<ServiceWizardData>;
  onNext: () => void;
  isEdit?: boolean;
}

export function ReviewStep({ form, onNext: _onNext, isEdit }: ReviewStepProps) {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Review Your Service</h2>
        <p className="text-muted-foreground text-lg">
          Review all details before {isEdit ? 'updating' : 'publishing'} your service
        </p>
      </div>

      {/* Service Preview */}
      <Card className="overflow-hidden border-2">
        <div className="relative">
          {featuredMedia ? (
            <div className="aspect-video relative">
              <Image src={featuredMedia.url} alt={formData.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-bold mb-1">{formData.title}</h3>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {category?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formData.durationMinutes} minutes
                  </span>
                </div>
              </div>
              <Badge className="absolute top-4 right-4 bg-white text-black font-medium">
                Preview
              </Badge>
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-3" />
                <p className="text-lg font-medium">No featured image</p>
                <p className="text-sm">Consider adding a photo to attract more clients</p>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-3">{formData.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{formData.description}</p>
              </div>

              {/* Hashtags */}
              {formData.hashtags && formData.hashtags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.hashtags.map((hashtag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {formData.media && formData.media.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Gallery ({formData.media.length} items)</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {formData.media.slice(0, 8).map((media, index) => (
                      <div
                        key={index}
                        className="aspect-square relative rounded-lg overflow-hidden border"
                      >
                        <Image
                          src={media.thumbnailUrl || media.url}
                          alt={`Media ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {media.isFeatured && (
                          <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    ))}
                    {formData.media.length > 8 && (
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground border">
                        +{formData.media.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Sidebar */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary">
                      ${formData.priceMin}
                      {formData.priceType === 'range' && formData.priceMax && (
                        <span className="text-lg text-muted-foreground">
                          {' '}
                          - ${formData.priceMax}
                        </span>
                      )}
                      {formData.priceType === 'starting_at' && (
                        <span className="text-sm font-normal text-muted-foreground"> starting</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {formData.priceType.replace('_', ' ')} price
                    </p>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{formData.durationMinutes} min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deposit:</span>
                      <span className="font-medium">
                        {formData.depositType === 'PERCENTAGE'
                          ? `${formData.depositAmount}%`
                          : `$${formData.depositAmount}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add-ons Summary */}
              {formData.addons && formData.addons.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Add-ons Available
                    </h4>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {formData.addons.slice(0, 3).map((addon, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{addon.name}</span>
                          <span className="font-medium">+${addon.price}</span>
                        </div>
                      ))}
                      {formData.addons.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{formData.addons.length - 3} more add-ons
                        </div>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total with all add-ons:</span>
                      <span className="text-primary">
                        ${(formData.priceMin + totalAddonsPrice).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Basic Information */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Basic Info
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={getStepEditHandler('basic')}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Title:</span>
              <p className="font-medium">{formData.title}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Category:</span>
              <p className="font-medium">{category?.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Description:</span>
              <p className="text-sm mt-1 line-clamp-2">
                {formData.description?.substring(0, 100)}...
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Pricing
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={getStepEditHandler('pricing')}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Price:</span>
              <p className="font-medium">
                ${formData.priceMin}
                {formData.priceType === 'range' && formData.priceMax && ` - $${formData.priceMax}`}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Duration:</span>
              <p className="font-medium">{formData.durationMinutes} minutes</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Deposit:</span>
              <p className="font-medium">
                {formData.depositType === 'PERCENTAGE'
                  ? `${formData.depositAmount}%`
                  : `$${formData.depositAmount}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Media
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={getStepEditHandler('media')}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total files:</span>
              <span className="font-medium">{formData.media?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Featured:</span>
              <span className="font-medium">{featuredMedia ? 'Set' : 'None'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Add-ons & Variations */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Extras
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={getStepEditHandler('addons')}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Add-ons:</span>
              <span className="font-medium">{formData.addons?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Variations:</span>
              <span className="font-medium">{formData.variations?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publishing Options */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" />
            Publishing Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div className="flex-1">
              <Label htmlFor="publish-active" className="font-semibold text-base">
                Publish as Active
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Service will be visible to clients and bookable immediately
              </p>
            </div>
            <Switch
              id="publish-active"
              checked={publishAsActive}
              onCheckedChange={setPublishAsActive}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div className="flex-1">
              <Label htmlFor="accept-clients" className="font-semibold text-base">
                Accept New Clients
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
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
        <Card className="bg-gradient-to-r from-warning/10 to-warning/20 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">No media uploaded</h4>
                <p className="text-sm text-yellow-700">
                  Services with photos get 10x more bookings. Consider adding at least one image.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Preview */}
      <Card className="bg-gradient-to-r from-success/10 to-success/20 border-success/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-success/10 rounded-full">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-muted-foreground mb-3">After Publishing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Your service will appear in search results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Clients can view details and book appointments</span>
                  </div>
                  {publishAsActive && (
                    <div className="flex items-center gap-2">
                      <Hourglass className="h-4 w-4" />
                      <span>Clients can book immediately</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>You can edit or deactivate it anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Track views and bookings in your dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
