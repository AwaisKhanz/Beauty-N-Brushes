'use client';

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, Info, Calculator, AlertCircle } from 'lucide-react';
import { ServiceWizardData } from '../ServiceCreationWizard';

interface PricingStepProps {
  form: UseFormReturn<ServiceWizardData>;
  onNext: () => void;
  isEdit?: boolean;
}

// Pricing recommendations by category
const CATEGORY_PRICING = {
  hair: {
    cuts: { min: 25, max: 150, duration: 60 },
    color: { min: 80, max: 300, duration: 120 },
    treatments: { min: 40, max: 200, duration: 90 },
    extensions: { min: 200, max: 800, duration: 180 },
    braids: { min: 50, max: 250, duration: 120 },
  },
  makeup: {
    everyday: { min: 40, max: 100, duration: 45 },
    'special-event': { min: 75, max: 200, duration: 60 },
    bridal: { min: 150, max: 500, duration: 90 },
    photoshoot: { min: 100, max: 300, duration: 75 },
  },
  nails: {
    manicure: { min: 25, max: 75, duration: 45 },
    pedicure: { min: 35, max: 85, duration: 60 },
    gel: { min: 35, max: 90, duration: 60 },
    acrylic: { min: 45, max: 120, duration: 90 },
  },
  skincare: {
    facials: { min: 60, max: 200, duration: 75 },
    peels: { min: 100, max: 300, duration: 60 },
    microdermabrasion: { min: 80, max: 180, duration: 60 },
  },
  lashes: {
    extensions: { min: 100, max: 400, duration: 120 },
    lifts: { min: 50, max: 120, duration: 60 },
    tinting: { min: 25, max: 60, duration: 30 },
  },
  brows: {
    shaping: { min: 20, max: 60, duration: 30 },
    tinting: { min: 25, max: 65, duration: 45 },
    microblading: { min: 300, max: 800, duration: 150 },
  },
} as const;

export function PricingStep({ form }: PricingStepProps) {
  const [calculatedDeposit, setCalculatedDeposit] = useState<number>(0);
  const [suggestedPricing, setSuggestedPricing] = useState<{
    min: number;
    max: number;
    duration: number;
  } | null>(null);

  const priceType = form.watch('priceType');
  const priceMin = form.watch('priceMin');
  const priceMax = form.watch('priceMax');
  const depositType = form.watch('depositType');
  const depositAmount = form.watch('depositAmount');
  const category = form.watch('category');
  const subcategory = form.watch('subcategory');

  // Calculate deposit based on price and type
  useEffect(() => {
    if (priceMin && depositAmount) {
      if (depositType === 'PERCENTAGE') {
        setCalculatedDeposit((priceMin * depositAmount) / 100);
      } else {
        setCalculatedDeposit(depositAmount);
      }
    }
  }, [priceMin, depositAmount, depositType]);

  // Get pricing suggestions based on category/subcategory
  useEffect(() => {
    if (category && subcategory) {
      const categoryData = CATEGORY_PRICING[category as keyof typeof CATEGORY_PRICING];
      if (categoryData) {
        const subcategoryData = categoryData[subcategory as keyof typeof categoryData];
        if (subcategoryData) {
          setSuggestedPricing(subcategoryData);
        }
      }
    }
  }, [category, subcategory]);

  const applySuggestedPricing = () => {
    if (suggestedPricing) {
      form.setValue('priceMin', suggestedPricing.min);
      if (priceType === 'range') {
        form.setValue('priceMax', suggestedPricing.max);
      }
      form.setValue('durationMinutes', suggestedPricing.duration);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Suggestions */}
      {suggestedPricing && (
        <Card className="bg-info/10 border-info/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-info-foreground mb-1">💡 Pricing Suggestion</h4>
                <p className="text-sm text-info-foreground mb-2">
                  Based on similar {category} services in your area:
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />${suggestedPricing.min} - $
                    {suggestedPricing.max}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {suggestedPricing.duration} minutes
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applySuggestedPricing}
                className="bg-white"
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <FormField
            control={form.control}
            name="priceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fixed">
                      <div>
                        <div className="font-medium">Fixed Price</div>
                        <div className="text-xs text-muted-foreground">
                          One set price for the service
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="range">
                      <div>
                        <div className="font-medium">Price Range</div>
                        <div className="text-xs text-muted-foreground">Min - Max price range</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="starting_at">
                      <div>
                        <div className="font-medium">Starting At</div>
                        <div className="text-xs text-muted-foreground">
                          Base price, may increase
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price Min */}
        <div className="md:col-span-1">
          <FormField
            control={form.control}
            name="priceMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {priceType === 'range' ? 'Minimum Price ($) *' : 'Price ($) *'}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price Max (only for range) */}
        {priceType === 'range' && (
          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="priceMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Price ($) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="durationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Service Duration (minutes) *
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="60"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>How long does this service typically take?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration Quick Buttons */}
        <div className="space-y-2">
          <Label>Quick Duration</Label>
          <div className="flex flex-wrap gap-2">
            {[30, 45, 60, 90, 120, 180].map((duration) => (
              <Button
                key={duration}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.setValue('durationMinutes', duration)}
                className={
                  form.watch('durationMinutes') === duration
                    ? 'bg-primary text-primary-foreground'
                    : ''
                }
              >
                {duration}m
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Deposit Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Deposit Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="depositType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">
                        <div>
                          <div className="font-medium">Percentage</div>
                          <div className="text-xs text-muted-foreground">% of service price</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="FLAT">
                        <div>
                          <div className="font-medium">Fixed Amount</div>
                          <div className="text-xs text-muted-foreground">Set dollar amount</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Deposit Amount {depositType === 'PERCENTAGE' ? '(%)' : '($)'} *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      {depositType === 'PERCENTAGE' ? (
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      ) : (
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      )}
                      <Input
                        type="number"
                        placeholder={depositType === 'PERCENTAGE' ? '50' : '25'}
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Deposit Preview */}
          {priceMin && depositAmount && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculated Deposit:</span>
                <Badge variant="secondary" className="text-base">
                  ${calculatedDeposit.toFixed(2)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on{' '}
                {depositType === 'PERCENTAGE'
                  ? `${depositAmount}% of $${priceMin}`
                  : `$${depositAmount} fixed amount`}
              </p>
            </div>
          )}

          {/* Deposit Quick Buttons for percentage */}
          {depositType === 'PERCENTAGE' && (
            <div className="space-y-2">
              <Label>Common Deposit Percentages</Label>
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('depositAmount', percentage)}
                    className={
                      form.watch('depositAmount') === percentage
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile/Home Service Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Mobile Service Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <FormField
              control={form.control}
              name="mobileServiceAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Offer mobile/home service</FormLabel>
                    <FormDescription>
                      Allow clients to book this service at their location
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {form.watch('mobileServiceAvailable') && (
            <FormField
              control={form.control}
              name="homeServiceFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional fee for home service</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="25"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Additional cost for traveling to client's location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Pricing Tips */}
      <Card className="bg-warning/10 border-warning/20">
        <CardContent className="p-4">
          <h4 className="font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Pricing Best Practices
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Research competitor pricing for similar services</li>
            <li>• Consider your experience level and location</li>
            <li>• Factor in costs: products, supplies, overhead</li>
            <li>• Price ranges work well for services that vary by complexity</li>
            <li>• Deposits protect against no-shows and cancellations</li>
            <li>• 50% deposit is standard for most beauty services</li>
          </ul>
        </CardContent>
      </Card>

      {/* Price Validation Warnings */}
      {priceType === 'range' && priceMin && priceMax && priceMax <= priceMin && (
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Maximum price must be higher than minimum price</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              form.formState.errors.priceMin ||
              form.formState.errors.durationMinutes ||
              form.formState.errors.depositAmount
                ? 'bg-destructive'
                : priceMin && form.watch('durationMinutes') && depositAmount
                  ? 'bg-success'
                  : 'bg-muted'
            }`}
          />
          <span className="text-sm font-medium">
            {form.formState.errors.priceMin ||
            form.formState.errors.durationMinutes ||
            form.formState.errors.depositAmount
              ? 'Please complete all pricing fields'
              : priceMin && form.watch('durationMinutes') && depositAmount
                ? 'Pricing setup complete'
                : 'Set your pricing and duration'}
          </span>
        </div>

        {priceMin && (
          <div className="text-right text-sm text-muted-foreground">
            <div>
              Service: ${priceMin}
              {priceType === 'range' && priceMax ? ` - $${priceMax}` : ''}
            </div>
            <div>Deposit: ${calculatedDeposit.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
