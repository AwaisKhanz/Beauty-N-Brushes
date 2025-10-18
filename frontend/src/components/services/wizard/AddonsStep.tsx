'use client';

import { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, DollarSign, Clock, Settings, TrendingUp, Lightbulb } from 'lucide-react';
import { ServiceWizardData } from '../ServiceCreationWizard';

interface AddonsStepProps {
  form: UseFormReturn<ServiceWizardData>;
  onNext: () => void;
  isEdit?: boolean;
}

// Common add-ons by category
const COMMON_ADDONS = {
  hair: [
    { name: 'Deep Conditioning Treatment', price: 25, duration: 15 },
    { name: 'Scalp Massage', price: 15, duration: 10 },
    { name: 'Glossing Treatment', price: 30, duration: 20 },
    { name: 'Hair Styling (after service)', price: 20, duration: 30 },
    { name: 'Home Service (travel to client)', price: 50, duration: 0 },
  ],
  makeup: [
    { name: 'False Lashes Application', price: 20, duration: 15 },
    { name: 'Lip Touch-up Kit', price: 15, duration: 5 },
    { name: 'HD Photography Finish', price: 40, duration: 20 },
    { name: 'Makeup Setting (for long events)', price: 25, duration: 10 },
    { name: 'On-location Service', price: 75, duration: 0 },
  ],
  nails: [
    { name: 'Nail Art (per nail)', price: 5, duration: 5 },
    { name: 'French Tips', price: 10, duration: 15 },
    { name: 'Cuticle Oil Treatment', price: 8, duration: 5 },
    { name: 'Hand/Foot Massage', price: 15, duration: 10 },
    { name: 'Express Dry Service', price: 10, duration: 10 },
  ],
  skincare: [
    { name: 'LED Light Therapy', price: 35, duration: 20 },
    { name: 'Eye Treatment Add-on', price: 25, duration: 15 },
    { name: 'Lip Treatment', price: 15, duration: 10 },
    { name: 'Décolletage Treatment', price: 30, duration: 20 },
    { name: 'Take-home Products', price: 40, duration: 0 },
  ],
  lashes: [
    { name: 'Bottom Lash Extensions', price: 25, duration: 30 },
    { name: 'Colored Lashes', price: 15, duration: 0 },
    { name: 'Extra Volume', price: 20, duration: 15 },
    { name: 'Lash Sealer', price: 10, duration: 5 },
    { name: 'Aftercare Kit', price: 25, duration: 0 },
  ],
  brows: [
    { name: 'Brow Lamination', price: 35, duration: 30 },
    { name: 'Brow Mapping', price: 15, duration: 15 },
    { name: 'Henna Tinting', price: 20, duration: 20 },
    { name: 'Aftercare Products', price: 30, duration: 0 },
  ],
} as const;

// Common variations
const COMMON_VARIATIONS = {
  hair: [
    { name: 'Short Hair (above shoulders)', priceAdjustment: 0, durationAdjustment: 0 },
    { name: 'Medium Hair (shoulder to mid-back)', priceAdjustment: 15, durationAdjustment: 15 },
    { name: 'Long Hair (below mid-back)', priceAdjustment: 30, durationAdjustment: 30 },
    { name: 'Very Long/Thick Hair', priceAdjustment: 50, durationAdjustment: 45 },
    { name: 'Color Correction Required', priceAdjustment: 100, durationAdjustment: 60 },
  ],
  makeup: [
    { name: 'Natural/Everyday Look', priceAdjustment: 0, durationAdjustment: 0 },
    { name: 'Glam/Evening Look', priceAdjustment: 25, durationAdjustment: 15 },
    { name: 'Editorial/Creative Look', priceAdjustment: 50, durationAdjustment: 30 },
    { name: 'Mature Skin Specialist', priceAdjustment: 20, durationAdjustment: 10 },
  ],
  nails: [
    { name: 'Basic Polish', priceAdjustment: 0, durationAdjustment: 0 },
    { name: 'Gel Polish Upgrade', priceAdjustment: 15, durationAdjustment: 15 },
    { name: 'Nail Art (simple)', priceAdjustment: 20, durationAdjustment: 20 },
    { name: 'Nail Art (complex)', priceAdjustment: 40, durationAdjustment: 40 },
    { name: 'Length Extensions', priceAdjustment: 25, durationAdjustment: 30 },
  ],
} as const;

export function AddonsStep({ form, onNext }: AddonsStepProps) {
  const [activeTab, setActiveTab] = useState('addons');

  const category = form.watch('category');
  const basePrice = form.watch('priceMin');

  const {
    fields: addonFields,
    append: appendAddon,
    remove: removeAddon,
  } = useFieldArray({
    control: form.control,
    name: 'addons',
  });

  const {
    fields: variationFields,
    append: appendVariation,
    remove: removeVariation,
  } = useFieldArray({
    control: form.control,
    name: 'variations',
  });

  const addCommonAddon = (addon: { name: string; price: number; duration: number }) => {
    if (!addonFields.some((field) => field.name === addon.name)) {
      appendAddon({ ...addon, description: '' });
    }
  };

  const addCommonVariation = (variation: {
    name: string;
    priceAdjustment: number;
    durationAdjustment: number;
  }) => {
    if (!variationFields.some((field) => field.name === variation.name)) {
      appendVariation({ ...variation, description: '' });
    }
  };

  const calculateTotalWithAddons = () => {
    const addonTotal = addonFields.reduce((sum, addon) => sum + (addon.price || 0), 0);
    return (basePrice || 0) + addonTotal;
  };

  const calculateDurationWithAddons = () => {
    const baseDuration = form.watch('durationMinutes') || 0;
    const addonDuration = addonFields.reduce((sum, addon) => sum + (addon.duration || 0), 0);
    return baseDuration + addonDuration;
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-tertiary/10 to-accent/10 border-tertiary/20">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">💡 Boost Your Revenue</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Add-ons and variations let you offer personalized services and increase your average
            booking value.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span>Increase average sale by 20-40%</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-info" />
              <span>Customize services for each client</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="addons" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add-ons
            <Badge variant="secondary">{addonFields.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="variations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Variations
            <Badge variant="secondary">{variationFields.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Add-ons Tab */}
        <TabsContent value="addons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Service Add-ons
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Optional extras that clients can select to enhance their service experience.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Common Add-ons Suggestions */}
              {category && COMMON_ADDONS[category as keyof typeof COMMON_ADDONS] && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Popular Add-ons for {category} services:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {COMMON_ADDONS[category as keyof typeof COMMON_ADDONS].map((addon, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCommonAddon(addon)}
                        disabled={addonFields.some((field) => field.name === addon.name)}
                        className="justify-start text-left h-auto p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{addon.name}</div>
                          <div className="text-xs text-muted-foreground">
                            +${addon.price} • +{addon.duration}min
                          </div>
                        </div>
                        <Plus className="h-3 w-3 ml-2" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Add-on Form */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Create Custom Add-on:</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input placeholder="Add-on name" id="custom-addon-name" />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Price"
                      className="pl-10"
                      id="custom-addon-price"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Duration (min)"
                      className="pl-10"
                      id="custom-addon-duration"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      const name = (
                        document.getElementById('custom-addon-name') as HTMLInputElement
                      )?.value;
                      const price = Number(
                        (document.getElementById('custom-addon-price') as HTMLInputElement)?.value
                      );
                      const duration = Number(
                        (document.getElementById('custom-addon-duration') as HTMLInputElement)
                          ?.value
                      );

                      if (name && price >= 0 && duration >= 0) {
                        appendAddon({ name, price, duration, description: '' });
                        // Clear form
                        (document.getElementById('custom-addon-name') as HTMLInputElement).value =
                          '';
                        (document.getElementById('custom-addon-price') as HTMLInputElement).value =
                          '';
                        (
                          document.getElementById('custom-addon-duration') as HTMLInputElement
                        ).value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Current Add-ons */}
              {addonFields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Your Add-ons:</h4>
                  {addonFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
                        <FormField
                          control={form.control}
                          name={`addons.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`addons.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`addons.${index}.duration`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (min)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`addons.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (optional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} className="resize-none" rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeAddon(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variations Tab */}
        <TabsContent value="variations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Service Variations
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Different pricing tiers based on complexity, hair length, or other factors.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Common Variations Suggestions */}
              {category && COMMON_VARIATIONS[category as keyof typeof COMMON_VARIATIONS] && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">
                    Common Variations for {category} services:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {COMMON_VARIATIONS[category as keyof typeof COMMON_VARIATIONS].map(
                      (variation, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addCommonVariation(variation)}
                          disabled={variationFields.some((field) => field.name === variation.name)}
                          className="justify-start text-left h-auto p-3"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{variation.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span
                                className={
                                  variation.priceAdjustment >= 0
                                    ? 'text-success'
                                    : 'text-destructive'
                                }
                              >
                                {variation.priceAdjustment >= 0 ? '+' : ''}$
                                {variation.priceAdjustment}
                              </span>
                              <span>•</span>
                              <span
                                className={
                                  variation.durationAdjustment >= 0
                                    ? 'text-success'
                                    : 'text-destructive'
                                }
                              >
                                {variation.durationAdjustment >= 0 ? '+' : ''}
                                {variation.durationAdjustment}min
                              </span>
                            </div>
                          </div>
                          <Plus className="h-3 w-3 ml-2" />
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Custom Variation Form */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Create Custom Variation:</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input placeholder="Variation name" id="custom-variation-name" />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Price adjustment"
                      className="pl-10"
                      id="custom-variation-price"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Duration adjustment"
                      className="pl-10"
                      id="custom-variation-duration"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      const name = (
                        document.getElementById('custom-variation-name') as HTMLInputElement
                      )?.value;
                      const priceAdjustment = Number(
                        (document.getElementById('custom-variation-price') as HTMLInputElement)
                          ?.value
                      );
                      const durationAdjustment = Number(
                        (document.getElementById('custom-variation-duration') as HTMLInputElement)
                          ?.value
                      );

                      if (name) {
                        appendVariation({
                          name,
                          priceAdjustment: priceAdjustment || 0,
                          durationAdjustment: durationAdjustment || 0,
                          description: '',
                        });
                        // Clear form
                        (
                          document.getElementById('custom-variation-name') as HTMLInputElement
                        ).value = '';
                        (
                          document.getElementById('custom-variation-price') as HTMLInputElement
                        ).value = '';
                        (
                          document.getElementById('custom-variation-duration') as HTMLInputElement
                        ).value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use positive numbers to increase price/time, negative to decrease
                </p>
              </div>

              {/* Current Variations */}
              {variationFields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Your Variations:</h4>
                  {variationFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
                        <FormField
                          control={form.control}
                          name={`variations.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variations.${index}.priceAdjustment`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price Adjustment ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variations.${index}.durationAdjustment`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time Adjustment (min)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variations.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (optional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} className="resize-none" rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeVariation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revenue Calculator */}
      {(addonFields.length > 0 || variationFields.length > 0) && (
        <Card className="bg-success/10 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success-foreground">
              <TrendingUp className="h-5 w-5" />
              Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">${basePrice || 0}</div>
                <div className="text-sm text-muted-foreground">Base Service</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">${calculateTotalWithAddons()}</div>
                <div className="text-sm text-muted-foreground">With All Add-ons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  +
                  {(
                    ((calculateTotalWithAddons() - (basePrice || 0)) / (basePrice || 1)) *
                    100
                  ).toFixed(0)}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Revenue Increase</div>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-success-foreground">
                Total duration with add-ons: {calculateDurationWithAddons()} minutes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-info/10 border-info/20">
        <CardContent className="p-4">
          <h4 className="font-medium text-info-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Pro Tips for Add-ons & Variations
          </h4>
          <ul className="text-sm text-info-foreground space-y-1">
            <li>
              • <strong>Add-ons</strong> are optional extras that clients can choose
            </li>
            <li>
              • <strong>Variations</strong> are different pricing tiers for the same service
            </li>
            <li>• Price add-ons to cover your time and materials</li>
            <li>• Use variations to handle different complexity levels</li>
            <li>• Consider bundling popular add-ons for better value</li>
            <li>• Keep descriptions clear and benefit-focused</li>
          </ul>
        </CardContent>
      </Card>

      {/* Skip Option */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          This step is optional. You can always add these later.
        </p>
        <Button variant="outline" onClick={onNext}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
