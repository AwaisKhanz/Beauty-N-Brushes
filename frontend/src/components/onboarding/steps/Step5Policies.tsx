'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
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
import { Sparkles, Clock, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const policiesSchema = z
  .object({
    cancellationPolicy: z.string().min(20, 'Cancellation policy must be at least 20 characters'),
    lateArrivalPolicy: z.string().min(20, 'Late arrival policy must be at least 20 characters'),
    depositRequired: z.boolean().default(true),
    depositType: z.enum(['percentage', 'fixed']),
    depositAmount: z.coerce.number().min(1, 'Deposit amount must be at least 1'),
    refundPolicy: z.string().min(20, 'Refund policy must be at least 20 characters'),
  })
  .refine(
    (data) => {
      // If deposit is required, validate deposit fields
      if (data.depositRequired) {
        return data.depositType && data.depositAmount > 0;
      }
      return true;
    },
    {
      message: 'Deposit type and amount are required when deposit is enabled',
      path: ['depositType'],
    }
  );

type PoliciesFormValues = z.infer<typeof policiesSchema>;

interface Step5PoliciesProps {
  defaultValues?: Partial<PoliciesFormValues> & { businessName?: string };
  onNext: (data: any) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step5Policies({ defaultValues, onNext, onBack, isLoading }: Step5PoliciesProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(!defaultValues?.cancellationPolicy);

  const form = useForm<PoliciesFormValues>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      depositRequired: true,
      depositType: 'percentage',
      depositAmount: 50,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        depositRequired: true,
        depositType: 'percentage',
        depositAmount: 50,
        ...defaultValues,
      });
      if (defaultValues.cancellationPolicy) {
        setShowAIPrompt(false);
      }
    }
  }, [defaultValues, form]);

  const generateAIPolicies = async () => {
    setIsGenerating(true);

    try {
      const depositType = form.getValues('depositType');
      const depositAmount = form.getValues('depositAmount');

      const response = await api.onboarding.generatePolicies({
        businessName: defaultValues?.businessName || 'Your Business',
        depositType,
        depositAmount: depositAmount ? parseFloat(depositAmount.toString()) : 50,
      });

      if (response.data?.policies) {
        const { cancellationPolicy, lateArrivalPolicy, refundPolicy } = response.data.policies;

        form.setValue('cancellationPolicy', cancellationPolicy);
        form.setValue('lateArrivalPolicy', lateArrivalPolicy);
        form.setValue('refundPolicy', refundPolicy);

        setShowAIPrompt(false);
      }
    } catch (error: any) {
      console.error('Error generating policies:', error);
      toast.error('Failed to generate policies', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  async function onSubmit(values: PoliciesFormValues) {
    await onNext({
      cancellationPolicy: values.cancellationPolicy,
      lateArrivalPolicy: values.lateArrivalPolicy,
      depositRequired: values.depositRequired,
      depositType: values.depositType,
      depositAmount: parseFloat(values.depositAmount.toString()),
      refundPolicy: values.refundPolicy,
    });
  }

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Business Policies</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Set your business policies to manage client expectations and protect your time
        </p>
      </div>

      {/* AI Policy Generation Prompt */}
      {showAIPrompt && (
        <Card className="mb-6 border-primary/20 bg-primary/5 w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Policy Assistant
            </CardTitle>
            <CardDescription>
              Let our AI help you create professional business policies based on industry best
              practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm">
                Would you like AI to generate suggested policies for your business?
              </p>
              <Button onClick={generateAIPolicies} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Policies
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Business Policies</CardTitle>
          <CardDescription>
            These policies will be displayed to clients before they book with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cancellationPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Cancellation Policy *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your cancellation policy..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      What happens if a client cancels or reschedules?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lateArrivalPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Late Arrival Policy *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your late arrival policy..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>How do you handle clients who arrive late?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Deposit Requirements
                </h3>

                <FormField
                  control={form.control}
                  name="depositRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Require deposit for bookings</FormLabel>
                        <FormDescription>
                          Enable this to require clients to pay a deposit when booking
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('depositRequired') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="depositType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
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
                            Deposit Amount{' '}
                            {form.watch('depositType') === 'percentage' ? '(%)' : '($)'}
                          </FormLabel>
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
                )}
              </div>

              <FormField
                control={form.control}
                name="refundPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Policy *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your refund policy..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Under what circumstances do you offer refunds?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={onBack} className="gap-2">
                  Back
                </Button>

                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          You can always update these policies later in your settings
        </p>
      </div>
    </div>
  );
}
