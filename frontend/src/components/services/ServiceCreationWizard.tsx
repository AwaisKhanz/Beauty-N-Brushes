'use client';

import { useState, useCallback, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Tags,
  DollarSign,
  Image as ImageIcon,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form } from '@/components/ui/form';
import { extractErrorMessage } from '@/lib/error-utils';

// Step Components
import { BasicInfoStep } from './wizard/BasicInfoStep';
import { AIDescriptionStep } from './wizard/AIDescriptionStep';
import { PricingStep } from './wizard/PricingStep';
import { MediaUploadStep } from './wizard/MediaUploadStep';
import { AddonsStep } from './wizard/AddonsStep';
import { ReviewStep } from './wizard/ReviewStep';

// Auto-save components
import { useServiceDraftAutoSave } from '@/hooks/useServiceDraftAutoSave';
import { DraftRecoveryDialog } from './DraftRecoveryDialog';
import { AutoSaveStatus } from './AutoSaveStatus';

export const serviceWizardSchema = z.object({
  // Basic Information
  title: z.string().min(3, 'Service title must be at least 3 characters').max(255),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().default(''),

  // Template tracking
  createdFromTemplate: z.boolean().optional(),
  templateId: z.string().optional(),
  templateName: z.string().optional(),

  // AI-Enhanced Description
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  hashtags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),

  // Pricing & Duration
  priceType: z.enum(['fixed', 'range', 'starting_at']),
  priceMin: z.coerce.number().min(1, 'Price must be at least $1'),
  priceMax: z.coerce.number().default(0),
  durationMinutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),

  // Deposit
  depositType: z.enum(['percentage', 'fixed']),
  depositAmount: z.coerce.number().min(1, 'Deposit amount required'),

  // Media
  media: z
    .array(
      z.object({
        url: z.string(),
        thumbnailUrl: z.string().default(''),
        mediaType: z.enum(['image', 'video']),
        caption: z.string().default(''),
        isFeatured: z.boolean().default(false),
        displayOrder: z.number(),
      })
    )
    .min(1, 'At least one image or video is required'),

  // Add-ons & Variations
  addons: z
    .array(
      z.object({
        name: z.string().min(2, 'Add-on name required'),
        description: z.string().default(''),
        price: z.coerce.number().min(0, 'Price must be positive'),
        duration: z.coerce.number().min(0, 'Duration must be positive'),
      })
    )
    .default([]),

  variations: z
    .array(
      z.object({
        name: z.string().min(2, 'Variation name required'),
        description: z.string().default(''),
        priceAdjustment: z.coerce.number(),
        durationAdjustment: z.coerce.number().default(0),
      })
    )
    .default([]),
});

export type ServiceWizardData = z.infer<typeof serviceWizardSchema>;

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  // Each step component has slightly different prop requirements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  isCompleted?: boolean;
  isOptional?: boolean;
}

// Draft recovery data structure
interface DraftRecoveryData {
  draftData: Partial<ServiceWizardData>;
  currentStep: number;
  timestamp: string;
}

interface ServiceCreationWizardProps {
  onComplete: (data: ServiceWizardData) => Promise<void>;
  initialData?: Partial<ServiceWizardData>;
  isEdit?: boolean;
}

export function ServiceCreationWizard({
  onComplete,
  initialData,
  isEdit = false,
}: ServiceCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftRecoveryData | null>(null);

  const form = useForm<ServiceWizardData>({
    resolver: zodResolver(serviceWizardSchema),
    defaultValues: {
      // Basic Information
      title: initialData?.title || '',
      category: initialData?.category || '',
      subcategory: initialData?.subcategory || '',

      // Template tracking
      createdFromTemplate: initialData?.createdFromTemplate || false,
      templateId: initialData?.templateId || undefined,
      templateName: initialData?.templateName || undefined,

      // AI-Enhanced Description
      description: initialData?.description || '',
      hashtags: initialData?.hashtags || [],
      keywords: initialData?.keywords || [],

      // Pricing & Duration
      priceType: initialData?.priceType || 'fixed',
      priceMin: initialData?.priceMin || 0,
      priceMax: initialData?.priceMax || 0,
      durationMinutes: initialData?.durationMinutes || 60,

      // Deposit
      depositType: initialData?.depositType || 'percentage',
      depositAmount: initialData?.depositAmount || 50,

      // Media
      media: initialData?.media || [],

      // Add-ons & Variations
      addons: initialData?.addons || [],
      variations: initialData?.variations || [],
    },
    mode: 'onChange',
  });

  // Auto-save hook
  const { autoSave, saveStatus, lastSaved, loadFromLocalStorage, loadFromServer, clearDraft } =
    useServiceDraftAutoSave(form, currentStep, isEdit);

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && isEdit) {
      form.reset({
        // Basic Information
        title: initialData.title || '',
        category: initialData.category || '',
        subcategory: initialData.subcategory || '',

        // Template tracking
        createdFromTemplate: initialData.createdFromTemplate || false,
        templateId: initialData.templateId || undefined,
        templateName: initialData.templateName || undefined,

        // AI-Enhanced Description
        description: initialData.description || '',
        hashtags: initialData.hashtags || [],
        keywords: initialData.keywords || [],

        // Pricing & Duration
        priceType: initialData.priceType || 'fixed',
        priceMin: initialData.priceMin || 0,
        priceMax: initialData.priceMax || 0,
        durationMinutes: initialData.durationMinutes || 60,

        // Deposit
        depositType: initialData.depositType || 'percentage',
        depositAmount: initialData.depositAmount || 50,

        // Media
        media: initialData.media || [],

        // Add-ons & Variations
        addons: initialData.addons || [],
        variations: initialData.variations || [],
      });
    }
  }, [initialData, isEdit, form]);

  const steps: Step[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Service title and category',
      icon: Tags,
      component: BasicInfoStep,
    },
    {
      id: 'ai-description',
      title: 'AI Description',
      description: 'Auto-generated description with hashtags',
      icon: Sparkles,
      component: AIDescriptionStep,
    },
    {
      id: 'pricing',
      title: 'Pricing & Duration',
      description: 'Set price, duration, and deposit',
      icon: DollarSign,
      component: PricingStep,
    },
    {
      id: 'media',
      title: 'Photos & Videos',
      description: 'Upload and tag your work',
      icon: ImageIcon,
      component: MediaUploadStep,
    },
    {
      id: 'addons',
      title: 'Add-ons & Variations',
      description: 'Optional extras and pricing variations',
      icon: Settings,
      component: AddonsStep,
      isOptional: true,
    },
    {
      id: 'review',
      title: 'Review & Publish',
      description: 'Final review before publishing',
      icon: Check,
      component: ReviewStep,
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Load draft on mount
  useEffect(() => {
    if (!isEdit && !initialData) {
      checkForDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkForDraft() {
    // Try server first, fallback to localStorage
    const serverDraft = await loadFromServer();
    const localDraft = loadFromLocalStorage();

    const draft = serverDraft || localDraft;

    if (draft) {
      setPendingDraft(draft);
      setShowDraftDialog(true);
    }
  }

  function handleRestoreDraft() {
    if (pendingDraft) {
      form.reset(pendingDraft.draftData);
      setCurrentStep(pendingDraft.currentStep);
    }
    setShowDraftDialog(false);
    setPendingDraft(null);
  }

  async function handleDiscardDraft() {
    await clearDraft();
    setShowDraftDialog(false);
    setPendingDraft(null);
  }

  // Validate current step
  const validateCurrentStep = useCallback(async () => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case 'basic-info':
        return await form.trigger(['title', 'category']);
      case 'ai-description':
        return await form.trigger(['description']);
      case 'pricing':
        return await form.trigger([
          'priceType',
          'priceMin',
          'durationMinutes',
          'depositType',
          'depositAmount',
        ]);
      case 'media':
        return await form.trigger(['media']);
      case 'addons':
        return true; // Optional step
      case 'review':
        return await form.trigger();
      default:
        return true;
    }
  }, [currentStep, form]);

  const nextStep = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error('Please complete all required fields');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Auto-save after moving to next step
      await autoSave();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger();

    if (!isValid) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = form.getValues();
      await onComplete(data);
      // Clear draft after successful creation
      await clearDraft();
      toast.success(`Service ${isEdit ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error submitting service:', error);
      toast.error(
        extractErrorMessage(error) || `Failed to ${isEdit ? 'update' : 'create'} service`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepComponent = currentStepData.component;

  return (
    <Form {...form}>
      {/* Draft Recovery Dialog */}
      <DraftRecoveryDialog
        open={showDraftDialog}
        draftTimestamp={pendingDraft?.timestamp || new Date().toISOString()}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Service' : 'Create New Service'}</h1>
          <p className="text-muted-foreground">
            Follow the steps to {isEdit ? 'update' : 'create'} your service listing
          </p>
        </div>

        {/* Progress Bar with Auto-Save Status */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <div className="flex items-center gap-4">
              <AutoSaveStatus status={saveStatus} lastSaved={lastSaved} />
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isAccessible = index <= currentStep;

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && setCurrentStep(index)}
                disabled={!isAccessible}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all duration-200',
                  isActive && 'border-primary bg-primary/5 shadow-sm',
                  isCompleted && 'border-success/20 bg-success/10',
                  !isAccessible && 'opacity-50 cursor-not-allowed',
                  isAccessible && !isActive && 'hover:border-primary/50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isActive && 'text-primary',
                      isCompleted && 'text-success'
                    )}
                  />
                  {isCompleted && <Check className="h-3 w-3 text-success" />}
                  {step.isOptional && (
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  {step.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentStepData.icon className="h-5 w-5" />
              {currentStepData.title}
              {currentStepData.isOptional && <Badge variant="outline">Optional</Badge>}
            </CardTitle>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </CardHeader>
          <CardContent>
            <StepComponent form={form} onNext={nextStep} isEdit={isEdit} />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEdit ? 'Updating...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isEdit ? 'Update Service' : 'Publish Service'}
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Form>
  );
}
