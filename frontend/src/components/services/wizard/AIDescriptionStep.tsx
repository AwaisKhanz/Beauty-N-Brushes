'use client';

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Sparkles,
  Loader2,
  X,
  Wand2,
  Hash,
  Tag,
  Clock,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { ServiceWizardData } from '../ServiceCreationWizard';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

interface AIDescriptionStepProps {
  form: UseFormReturn<ServiceWizardData>;
  onNext?: () => void;
  isEdit?: boolean;
}

// Tone options for AI generation
const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and expert tone' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'luxury', label: 'Luxury', description: 'Premium and elegant' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'energetic', label: 'Energetic', description: 'Vibrant and exciting' },
];

// Popular hashtags by category
const CATEGORY_HASHTAGS = {
  hair: [
    '#hairstylist',
    '#haircut',
    '#haircolor',
    '#balayage',
    '#highlights',
    '#blowout',
    '#hairtransformation',
    '#hairgoals',
    '#salon',
    '#beautyhair',
  ],
  makeup: [
    '#makeup',
    '#makeupArtist',
    '#beauty',
    '#glam',
    '#makeover',
    '#bridalmakeup',
    '#specialevent',
    '#makeupgoals',
    '#beautylook',
    '#cosmetics',
  ],
  nails: [
    '#nails',
    '#nailart',
    '#manicure',
    '#pedicure',
    '#naildesign',
    '#gelnails',
    '#acrylicnails',
    '#nailtech',
    '#nailsalon',
    '#nailgoals',
  ],
  skincare: [
    '#skincare',
    '#facial',
    '#glowingskin',
    '#antiaging',
    '#clearskin',
    '#skincaretreatment',
    '#healthyskin',
    '#skincareroutine',
    '#spa',
    '#esthetics',
  ],
  lashes: [
    '#lashes',
    '#lashextensions',
    '#lashlift',
    '#lashtech',
    '#eyelashes',
    '#volumelashes',
    '#classiclashes',
    '#lashgoals',
    '#beauty',
    '#lashsalon',
  ],
  brows: [
    '#brows',
    '#eyebrows',
    '#microblading',
    '#browshaping',
    '#browtinting',
    '#browstyling',
    '#browgoals',
    '#perfectbrows',
    '#browtech',
    '#beauty',
  ],
  waxing: [
    '#waxing',
    '#hairremoval',
    '#smoothskin',
    '#waxingsalon',
    '#esthetics',
    '#bodywaxing',
    '#facialwaxing',
    '#beautytreatment',
    '#selfcare',
    '#spa',
  ],
  bridal: [
    '#bridal',
    '#wedding',
    '#bride',
    '#bridalhair',
    '#bridalmakeup',
    '#weddingbeauty',
    '#specialday',
    '#weddingstylist',
    '#bridalparty',
    '#engaged',
  ],
};

export function AIDescriptionStep({ form }: AIDescriptionStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [selectedTone, setSelectedTone] = useState<
    'professional' | 'friendly' | 'luxury' | 'casual' | 'energetic'
  >('professional');
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const hashtags = form.watch('hashtags') || [];
  const keywords = form.watch('keywords') || [];

  const addHashtag = (hashtag: string) => {
    const currentHashtags = form.getValues('hashtags') || [];
    if (!currentHashtags.includes(hashtag)) {
      form.setValue('hashtags', [...currentHashtags, hashtag]);
    }
  };

  const removeHashtag = (index: number) => {
    const currentHashtags = form.getValues('hashtags') || [];
    const newHashtags = currentHashtags.filter((_, i) => i !== index);
    form.setValue('hashtags', newHashtags);
  };

  const addKeyword = (keyword: string) => {
    const currentKeywords = form.getValues('keywords') || [];
    if (!currentKeywords.includes(keyword)) {
      form.setValue('keywords', [...currentKeywords, keyword]);
    }
  };

  const removeKeyword = (index: number) => {
    const currentKeywords = form.getValues('keywords') || [];
    const newKeywords = currentKeywords.filter((_, i) => i !== index);
    form.setValue('keywords', newKeywords);
  };

  const title = form.watch('title');
  const category = form.watch('category');
  const subcategory = form.watch('subcategory');

  // Auto-suggest hashtags when category changes
  useEffect(() => {
    if (category && hashtags.length === 0) {
      const categoryHashtags = CATEGORY_HASHTAGS[category as keyof typeof CATEGORY_HASHTAGS] || [];
      const initialHashtags = categoryHashtags.slice(0, 5);
      form.setValue('hashtags', initialHashtags);
    }
  }, [category, hashtags.length, form]);

  const generateAIDescription = async () => {
    if (!title || !category) {
      toast.error('Missing Information', {
        description: 'Please complete the basic information first',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.services.generateDescription({
        title,
        category,
        subcategory,
        tone: selectedTone,
        includeHashtags: true,
        includeKeywords: true,
      });

      if (response.data) {
        form.setValue('description', response.data.description);

        // Set AI-generated hashtags
        if (response.data.hashtags) {
          form.setValue('hashtags', response.data.hashtags);
        }

        // Set AI-generated keywords
        if (response.data.keywords) {
          form.setValue('keywords', response.data.keywords);
        }

        // Set estimated duration if provided
        if (response.data.estimatedDuration) {
          setEstimatedDuration(response.data.estimatedDuration);
          if (!form.getValues('durationMinutes')) {
            form.setValue('durationMinutes', response.data.estimatedDuration);
          }
        }

        toast.success('AI Description Generated!', {
          description: 'Review and edit the description, hashtags, and keywords as needed',
        });
      }
    } catch (error: unknown) {
      console.error('Error generating description:', error);
      toast.error('AI Generation Failed', {
        description: extractErrorMessage(error) || 'Please write the description manually',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMoreHashtags = async () => {
    if (!title || !category) return;

    setIsGeneratingHashtags(true);

    try {
      const response = await api.services.generateHashtags({
        title,
        category,
        subcategory,
        existingHashtags: hashtags,
      });

      if (response.data?.hashtags) {
        const currentHashtags = form.getValues('hashtags') || [];
        const newHashtags = response.data.hashtags.filter(
          (hashtag: string) => !currentHashtags.includes(hashtag)
        );
        form.setValue('hashtags', [...currentHashtags, ...newHashtags]);

        toast.success('More hashtags generated!');
      }
    } catch (error) {
      toast.error('Failed to generate more hashtags');
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      toast.success(`${type} copied to clipboard!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const addCustomHashtag = (hashtag: string) => {
    const formattedHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    if (hashtag.trim() && !hashtags.includes(formattedHashtag)) {
      addHashtag(formattedHashtag);
    }
  };

  const addCustomKeyword = (keyword: string) => {
    if (keyword.trim() && !keywords.includes(keyword)) {
      addKeyword(keyword);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-tertiary" />
            AI-Powered Description Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Writing Tone</Label>
              <Select
                value={selectedTone}
                onValueChange={(value) => setSelectedTone(value as typeof selectedTone)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      <div>
                        <div className="font-medium">{tone.label}</div>
                        <div className="text-xs text-muted-foreground">{tone.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateAIDescription}
                disabled={isGenerating || !title || !category}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {estimatedDuration && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 " />
              <span className="text-sm !text-muted-foreground">
                AI estimated duration: {estimatedDuration} minutes
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Service Description *</FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(field.value || '', 'Description')}
                className="gap-1"
              >
                {copiedText === 'Description' ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </Button>
            </div>
            <FormControl>
              <Textarea
                placeholder="Describe your service in detail. What can clients expect? What techniques do you use? What makes your service special?"
                className="min-h-[150px] text-base"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Tell clients what to expect from your service. Be specific about techniques, benefits,
              and what's included.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Hashtags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtags
            <Badge variant="secondary">{hashtags.length}/15</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {hashtags.map((hashtag, index) => (
              <Badge key={index} variant="outline" className="gap-1 pr-1">
                {hashtag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeHashtag(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add custom hashtag..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomHashtag(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={generateMoreHashtags}
              disabled={isGeneratingHashtags || hashtags.length >= 15}
            >
              {isGeneratingHashtags ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Hashtags help clients discover your services. Use popular and specific tags. Press Enter
            to add.
          </p>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Keywords
            <Badge variant="secondary">{keywords.length}/10</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {keyword}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeKeyword(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          <Input
            placeholder="Add keywords clients might search for..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomKeyword(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />

          <p className="text-sm text-muted-foreground">
            Keywords improve search visibility. Think about terms clients use when looking for your
            services.
          </p>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-success/10 border-success/20">
        <CardContent className="p-4">
          <h4 className="font-medium !text-muted-foreground mb-2">✨ AI Writing Tips:</h4>
          <ul className="text-sm !text-muted-foreground space-y-1">
            <li>• AI generates descriptions based on your service title and category</li>
            <li>• Choose the tone that matches your brand personality</li>
            <li>• Edit the AI-generated content to add your personal touch</li>
            <li>• Include specific benefits and what makes you unique</li>
            <li>• Use hashtags and keywords for better discoverability</li>
          </ul>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              form.formState.errors.description
                ? 'bg-destructive'
                : form.watch('description') && form.watch('description').length >= 20
                  ? 'bg-success'
                  : 'bg-muted'
            }`}
          />
          <span className="text-sm font-medium">
            {form.formState.errors.description
              ? 'Description is required'
              : form.watch('description') && form.watch('description').length >= 20
                ? 'Description looks great!'
                : 'Add a detailed description'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {form.watch('description')?.length || 0}/1000 characters
        </div>
      </div>
    </div>
  );
}
