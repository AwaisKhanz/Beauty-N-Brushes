'use client';

import { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function AddonsStep({ form, onNext }: AddonsStepProps) {
  const [activeTab, setActiveTab] = useState('addons');
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonDuration, setNewAddonDuration] = useState('');
  const [newVariationName, setNewVariationName] = useState('');
  const [newVariationPrice, setNewVariationPrice] = useState('');
  const [newVariationDuration, setNewVariationDuration] = useState('');

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

  const addCustomAddon = () => {
    if (newAddonName.trim()) {
      appendAddon({
        name: newAddonName.trim(),
        price: Number(newAddonPrice) || 0,
        duration: Number(newAddonDuration) || 0,
        description: '',
      });
      setNewAddonName('');
      setNewAddonPrice('');
      setNewAddonDuration('');
    }
  };

  const addCustomVariation = () => {
    if (newVariationName.trim()) {
      appendVariation({
        name: newVariationName.trim(),
        priceAdjustment: Number(newVariationPrice) || 0,
        durationAdjustment: Number(newVariationDuration) || 0,
        description: '',
      });
      setNewVariationName('');
      setNewVariationPrice('');
      setNewVariationDuration('');
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Enhance Your Service</h2>
        <p className="text-muted-foreground">
          Add optional extras and pricing variations to maximize your revenue
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-10">
          <TabsTrigger value="addons" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add-ons
            {addonFields.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {addonFields.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="variations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Variations
            {variationFields.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {variationFields.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Add-ons Tab */}
        <TabsContent value="addons" className="space-y-6">
          {/* Custom Add-on Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Custom Add-on</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Add-on name"
                  value={newAddonName}
                  onChange={(e) => setNewAddonName(e.target.value)}
                />
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Price"
                    className="pl-10"
                    value={newAddonPrice}
                    onChange={(e) => setNewAddonPrice(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Duration (min)"
                    className="pl-10"
                    value={newAddonDuration}
                    onChange={(e) => setNewAddonDuration(e.target.value)}
                  />
                </div>
                <Button onClick={addCustomAddon} disabled={!newAddonName.trim()}>
                  Add Add-on
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Add-ons */}
          {addonFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Add-ons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addonFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`addons.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Name</FormLabel>
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
                            <FormLabel className="text-sm">Price ($)</FormLabel>
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
                            <FormLabel className="text-sm">Duration (min)</FormLabel>
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
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAddon(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Variations Tab */}
        <TabsContent value="variations" className="space-y-6">
          {/* Custom Variation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Custom Variation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Variation name"
                  value={newVariationName}
                  onChange={(e) => setNewVariationName(e.target.value)}
                />
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Price adjustment"
                    className="pl-10"
                    value={newVariationPrice}
                    onChange={(e) => setNewVariationPrice(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Duration adjustment"
                    className="pl-10"
                    value={newVariationDuration}
                    onChange={(e) => setNewVariationDuration(e.target.value)}
                  />
                </div>
                <Button onClick={addCustomVariation} disabled={!newVariationName.trim()}>
                  Add Variation
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use positive numbers to increase price/time, negative to decrease
              </p>
            </CardContent>
          </Card>

          {/* Current Variations */}
          {variationFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Variations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {variationFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`variations.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Name</FormLabel>
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
                            <FormLabel className="text-sm">Price Adjustment ($)</FormLabel>
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
                            <FormLabel className="text-sm">Time Adjustment (min)</FormLabel>
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
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVariation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Revenue Impact */}
      {(addonFields.length > 0 || variationFields.length > 0) && (
        <Card className="bg-gradient-to-r from-success/10 to-success/20 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <TrendingUp className="h-5 w-5" />
              Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-3xl font-bold text-success">${basePrice || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Base Service</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-3xl font-bold text-success">${calculateTotalWithAddons()}</div>
                <div className="text-sm text-muted-foreground mt-1">With Add-ons</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-3xl font-bold text-success">
                  +
                  {(
                    ((calculateTotalWithAddons() - (basePrice || 0)) / (basePrice || 1)) *
                    100
                  ).toFixed(0)}
                  %
                </div>
                <div className="text-sm text-muted-foreground mt-1">Revenue Increase</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-success">
                Total duration: {calculateDurationWithAddons()} minutes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-info/10 border-info/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-info/10 rounded-full">
              <Lightbulb className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-muted-foreground mb-2">Pro Tips</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium mb-1">Add-ons</p>
                  <p>Optional extras clients can choose to enhance their service</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Variations</p>
                  <p>Different pricing tiers for complexity levels (e.g., hair length)</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skip Option */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          This step is optional. You can always add these later.
        </p>
        <Button variant="outline" onClick={onNext} className="px-8">
          Continue to Review
        </Button>
      </div>
    </div>
  );
}
