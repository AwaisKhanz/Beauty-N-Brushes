'use client';

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Zap, Package, Clock, DollarSign } from 'lucide-react';
import { ServiceWizardData } from '../ServiceCreationWizard';
import {
  getEssentialCategories,
  getOptionalCategories,
  getCategoryById,
} from '@/constants/services';
import type { ServiceTemplate, ServiceCategory, ServiceSubcategory } from '@/constants/services';

interface BasicInfoStepProps {
  form: UseFormReturn<ServiceWizardData>;
  onNext?: () => void;
  isEdit?: boolean;
}

export function BasicInfoStep({ form, isEdit }: BasicInfoStepProps) {
  const [creationMode, setCreationMode] = useState<'preset' | 'custom'>('preset');
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);

  const selectedCategory = form.watch('category');
  const selectedSubcategory = form.watch('subcategory');
  const createdFromTemplate = form.watch('createdFromTemplate');
  const templateId = form.watch('templateId');

  const currentCategory = selectedCategory ? getCategoryById(selectedCategory) : null;
  const currentSubcategory = currentCategory?.subcategories?.find(
    (sub: ServiceSubcategory) => sub.id === selectedSubcategory
  );

  // Get templates to display
  const templatesToShow = currentSubcategory?.templates || currentCategory?.templates || [];

  // Debug logging removed - template restoration happens in useEffect below

  // On mount: If editing a service created from template OR restoring a draft with template, restore template state
  useEffect(() => {
    // Only run template restoration if we have template data AND we're either editing or have a template ID
    if (createdFromTemplate && templateId && selectedCategory && templatesToShow.length > 0) {
      // Find the template that was used
      let originalTemplate = templatesToShow.find((t) => t.id === templateId);

      // Fallback: try to find by name if ID doesn't match
      if (!originalTemplate && templateId) {
        const templateName = form.getValues('templateName');
        if (templateName) {
          originalTemplate = templatesToShow.find((t) => t.name === templateName);
        }
      }

      if (originalTemplate) {
        setCreationMode('preset');
        setSelectedTemplate(originalTemplate);
      } else {
        // Only switch to custom mode if we're in edit mode (not when browsing subcategories)
        if (isEdit) {
          setCreationMode('custom');
        }
        // For new services, keep preset mode but clear selection
        setSelectedTemplate(null);
      }
    } else if (createdFromTemplate === false) {
      // Explicitly custom service (edit or draft)
      setCreationMode('custom');
    }
    // Don't change mode if createdFromTemplate is undefined (new service browsing)
  }, [createdFromTemplate, templateId, selectedCategory, templatesToShow, form, isEdit]);

  // Auto-fill when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      // Set suggested duration
      if (selectedTemplate.suggestedDuration) {
        form.setValue('durationMinutes', selectedTemplate.suggestedDuration);
      }

      // Set suggested price
      if (selectedTemplate.suggestedPriceMin) {
        form.setValue('priceMin', selectedTemplate.suggestedPriceMin);
        form.setValue('priceType', 'fixed');
      }

      if (
        selectedTemplate.suggestedPriceMax &&
        selectedTemplate.suggestedPriceMax !== selectedTemplate.suggestedPriceMin
      ) {
        form.setValue('priceMax', selectedTemplate.suggestedPriceMax);
        form.setValue('priceType', 'range');
      }
    }
  }, [selectedTemplate, form]);

  const handleTemplateSelect = (template: ServiceTemplate) => {
    setSelectedTemplate(template);
    form.setValue('title', template.name);
    // Set template tracking fields
    form.setValue('createdFromTemplate', true);
    form.setValue('templateId', template.id);
    form.setValue('templateName', template.name);
    // Keep category and subcategory as already selected
  };

  const handleCustomMode = () => {
    setCreationMode('custom');
    setSelectedTemplate(null);
    // Clear template tracking when switching to custom
    form.setValue('createdFromTemplate', false);
    form.setValue('templateId', undefined);
    form.setValue('templateName', undefined);
  };

  const handlePresetMode = () => {
    setCreationMode('preset');
  };

  return (
    <div className="space-y-6">
      {/* Creation Mode Toggle */}
      <Tabs
        value={creationMode}
        onValueChange={(value) => setCreationMode(value as 'preset' | 'custom')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preset" onClick={handlePresetMode}>
            <Package className="h-4 w-4 mr-2" />
            Choose from Templates
          </TabsTrigger>
          <TabsTrigger value="custom" onClick={handleCustomMode}>
            <Sparkles className="h-4 w-4 mr-2" />
            Create Custom Service
          </TabsTrigger>
        </TabsList>

        {/* PRESET MODE */}
        <TabsContent value="preset" className="space-y-6">
          <Card className="bg-info/10 border-info/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <Zap className="h-4 w-4 inline mr-1" />
                <strong>AI-Powered Templates:</strong> Select a service template and we'll
                automatically fill in description, pricing, and duration suggestions.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('subcategory', '');
                      setSelectedTemplate(null);
                    }}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Essential Categories</SelectLabel>
                        {getEssentialCategories().map((category: ServiceCategory) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectSeparator />

                      <SelectGroup>
                        <SelectLabel>Optional Categories</SelectLabel>
                        {getOptionalCategories().map((category: ServiceCategory) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose your service category</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategory Selection (if category has subcategories) */}
            {currentCategory?.subcategories && (
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedTemplate(null);
                      }}
                      value={field.value || ''}
                      disabled={!selectedCategory}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentCategory.subcategories?.map((subcategory: ServiceSubcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose a specific subcategory</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Template Selection - Compact Dropdown */}
          {templatesToShow.length > 0 &&
            (selectedSubcategory || !currentCategory?.subcategories) && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Choose a Service Template ({templatesToShow.length} available)
                </Label>

                <Select
                  value={selectedTemplate?.id || ''}
                  onValueChange={(value) => {
                    const template = templatesToShow.find((t) => t.id === value);
                    if (template) {
                      handleTemplateSelect(template);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Select a template...">
                      {selectedTemplate && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">{selectedTemplate.name}</span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {selectedTemplate.suggestedDuration}m
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {selectedTemplate.suggestedPriceMin ===
                              selectedTemplate.suggestedPriceMax
                                ? `$${selectedTemplate.suggestedPriceMin}`
                                : `$${selectedTemplate.suggestedPriceMin}-${selectedTemplate.suggestedPriceMax}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {templatesToShow.map((template: ServiceTemplate) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">{template.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground ml-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {template.suggestedDuration}m
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {template.suggestedPriceMin === template.suggestedPriceMax
                                ? `$${template.suggestedPriceMin}`
                                : `$${template.suggestedPriceMin}-${template.suggestedPriceMax}`}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTemplate && (
                  <div className="mt-3 p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-secondary-foreground">
                      ✓ <strong>{selectedTemplate.name}</strong> selected! Duration and pricing will
                      be auto-filled in the next steps.
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Service Title (editable after template selection) */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Title *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      selectedTemplate
                        ? 'Edit the service name if needed'
                        : 'Select a template first'
                    }
                    disabled={!selectedTemplate}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {selectedTemplate
                    ? 'You can customize the service name'
                    : 'Choose a template to auto-fill the title'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>

        {/* CUSTOM MODE */}
        <TabsContent value="custom" className="space-y-6">
          <Card className="bg-info/10 border-info/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 inline mr-1" />
                <strong>Custom Service:</strong> Create your own unique service. AI will generate
                description, hashtags, and pricing suggestions based on your title.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            {/* Service Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Butterfly Locs, Galaxy Nails, Custom Bridal Package"
                      className="text-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive name for your custom service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category * (for classification)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('subcategory', '');
                      }}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Essential Categories</SelectLabel>
                          {getEssentialCategories().map((category: ServiceCategory) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>

                        <SelectSeparator />

                        <SelectGroup>
                          <SelectLabel>Optional Categories</SelectLabel>
                          {getOptionalCategories().map((category: ServiceCategory) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>Helps clients find your service</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subcategory (optional for custom services) */}
              {currentCategory?.subcategories && (
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={!selectedCategory}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currentCategory.subcategories?.map((subcategory: ServiceSubcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>More specific classification</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Helpful Tips */}
      <Card className="bg-info/10 border-info/20">
        <CardHeader>
          <CardTitle className="text-base">💡 Service Creation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground   space-y-1">
            <li>
              • <strong>Preset Templates:</strong> Fastest way to create services with AI-suggested
              pricing and duration
            </li>
            <li>
              • <strong>Custom Services:</strong> Perfect for unique offerings not in our templates
            </li>
            <li>• Be specific in your title (e.g., "Knotless Box Braids - Medium" vs "Braids")</li>
            <li>• All services must map to a category for search and analytics</li>
          </ul>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              form.formState.errors.title || form.formState.errors.category
                ? 'bg-destructive'
                : form.watch('title') && form.watch('category')
                  ? 'bg-success'
                  : 'bg-muted'
            }`}
          />
          <span className="text-sm font-medium">
            {form.formState.errors.title || form.formState.errors.category
              ? 'Please complete required fields'
              : form.watch('title') && form.watch('category')
                ? 'Ready to continue'
                : 'Complete basic information'}
          </span>
        </div>
        {creationMode === 'preset' && selectedTemplate && (
          <Badge variant="secondary">Template Selected</Badge>
        )}
      </div>
    </div>
  );
}
