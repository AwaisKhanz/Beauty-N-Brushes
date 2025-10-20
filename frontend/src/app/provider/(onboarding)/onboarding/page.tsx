'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Logo } from '@/components/shared/Logo';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { OnboardingStepper, type Step } from '@/components/onboarding/OnboardingStepper';
import { Step1AccountType } from '@/components/onboarding/steps/Step1AccountType';
import { Step2BusinessDetails } from '@/components/onboarding/steps/Step2BusinessDetails';
import { Step3ProfileMedia } from '@/components/onboarding/steps/Step3ProfileMedia';
import { Step4BrandCustomization } from '@/components/onboarding/steps/Step4BrandCustomization';
import { Step5Policies } from '@/components/onboarding/steps/Step5Policies';
import { Step6PaymentSetup } from '@/components/onboarding/steps/Step6PaymentSetup';
import { Step8Availability } from '@/components/onboarding/steps/Step8Availability';
import { ONBOARDING_STEPS, ONBOARDING_STORAGE_KEY, ROUTES } from '@/constants';

const STEPS: Step[] = ONBOARDING_STEPS.map((step) => ({ ...step }));

interface OnboardingDefaultValues {
  accountType?: 'solo' | 'salon';
  businessName?: string;
  tagline?: string;
  businessType?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  instagramHandle?: string;
  website?: string;
  serviceSpecializations?: string[];
  yearsExperience?: number;
  profilePhotoUrl?: string;
  logoUrl?: string;
  coverPhotoUrl?: string;
  brandColorPrimary?: string;
  brandColorSecondary?: string;
  brandColorAccent?: string;
  brandFontHeading?: string;
  brandFontBody?: string;
  policies?: {
    cancellationPolicy?: string;
    lateArrivalPolicy?: string;
    depositRequired?: boolean;
    refundPolicy?: string;
  };
  subscriptionTier?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultValues, setDefaultValues] = useState<OnboardingDefaultValues>({});

  // Fetch onboarding status and prefill data
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      try {
        const response = await api.onboarding.getStatus();
        const { status } = response.data;

        if (status.completed) {
          // Already completed, redirect to dashboard
          router.push(ROUTES.PROVIDER.DASHBOARD);
          return;
        }

        // Update steps completion status
        const updatedSteps = STEPS.map((step) => {
          let completed = false;

          switch (step.id) {
            case 1:
              completed = status.steps.accountType;
              break;
            case 2:
              completed = status.steps.businessDetails;
              break;
            case 3:
              completed = status.steps.profileMedia;
              break;
            case 4:
              completed = status.steps.brandCustomization;
              break;
            case 5:
              completed = status.steps.policies;
              break;
            case 6:
              completed = status.steps.paymentSetup;
              break;
            case 7:
              completed = status.steps.availabilitySet;
              break;
          }

          return { ...step, completed };
        });

        setSteps(updatedSteps);

        // Determine current step (prioritize server status over localStorage)
        const firstIncompleteStep = updatedSteps.find((s) => !s.completed);

        // Always use server-side onboarding status to determine current step
        if (firstIncompleteStep) {
          setCurrentStep(firstIncompleteStep.id);
          // Update localStorage to match server status
          localStorage.setItem(ONBOARDING_STORAGE_KEY, firstIncompleteStep.id.toString());
        } else {
          // All steps completed, stay on step 7 or redirect to dashboard
          setCurrentStep(7);
          localStorage.setItem(ONBOARDING_STORAGE_KEY, '7');
        }

        // Set default values for prefilling
        if (status.profile) {
          setDefaultValues({
            accountType: status.profile.isSalon ? 'salon' : 'solo',
            businessName: status.profile.businessName || '',
            tagline: status.profile.tagline || '',
            businessType: status.profile.businessType || '',
            description: status.profile.description || '',
            address: status.profile.addressLine1 || '',
            city: status.profile.city || '',
            state: status.profile.state || '',
            zipCode: status.profile.zipCode || '',
            country: status.profile.country || 'US',
            latitude: status.profile.latitude || undefined,
            longitude: status.profile.longitude || undefined,
            phone: status.profile.businessPhone || '',
            email: status.profile.businessEmail || '',
            instagramHandle: status.profile.instagramHandle || '',
            website: status.profile.websiteUrl || '',
            serviceSpecializations: status.profile.serviceSpecializations || [],
            yearsExperience: status.profile.yearsExperience || undefined,
            profilePhotoUrl: status.profile.avatarUrl || '',
            logoUrl: status.profile.logoUrl || '',
            coverPhotoUrl: status.profile.coverPhotoUrl || '',
            brandColorPrimary: status.profile.brandColorPrimary || '',
            brandColorSecondary: status.profile.brandColorSecondary || '',
            brandColorAccent: status.profile.brandColorAccent || '',
            brandFontHeading: status.profile.brandFontHeading || '',
            brandFontBody: status.profile.brandFontBody || '',
            policies: status.profile.policies
              ? {
                  cancellationPolicy: status.profile.policies.cancellationPolicy ?? undefined,
                  lateArrivalPolicy: status.profile.policies.lateArrivalPolicy ?? undefined,
                  depositRequired: status.profile.policies.depositRequired ?? undefined,
                  refundPolicy: status.profile.policies.refundPolicy ?? undefined,
                }
              : undefined,
            subscriptionTier: status.profile.subscriptionTier ?? undefined,
          });
        }
      } catch (error: unknown) {
        // Error is logged silently - user can retry if needed
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [router]);

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps or current step
    const targetStep = steps.find((s) => s.id === stepId);
    if (targetStep && (targetStep.completed || stepId <= currentStep)) {
      setCurrentStep(stepId);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, stepId.toString());
    }
  };

  const handleNext = async (stepId: number, data: any) => {
    setIsSaving(true);
    try {
      // Call appropriate API based on step
      switch (stepId) {
        case 1:
          await api.onboarding.createAccountType(data);
          setDefaultValues((prev) => ({ ...prev, accountType: data.accountType }));
          break;
        case 2:
          await api.onboarding.updateBusinessDetails(data);
          setDefaultValues((prev) => ({ ...prev, ...data }));
          break;
        case 3:
          await api.onboarding.saveProfileMedia(data);
          setDefaultValues((prev) => ({ ...prev, ...data }));
          break;
        case 4:
          await api.onboarding.updateBrandCustomization(data);
          setDefaultValues((prev) => ({ ...prev, ...data }));
          break;
        case 5:
          await api.onboarding.savePolicies(data);
          setDefaultValues((prev) => ({ ...prev, policies: data }));
          break;
        case 6:
          // Payment handled by child component
          break;
        case 7:
          await api.onboarding.setupAvailability(data);
          // Complete onboarding
          await api.onboarding.complete();
          localStorage.removeItem(ONBOARDING_STORAGE_KEY);
          router.push(ROUTES.PROVIDER.ONBOARDING_COMPLETE);
          return;
      }

      // Mark current step as completed
      const updatedSteps = steps.map((s) => (s.id === stepId ? { ...s, completed: true } : s));
      setSteps(updatedSteps);

      // Move to next step
      if (stepId < 7) {
        const nextStep = stepId + 1;
        setCurrentStep(nextStep);
        localStorage.setItem(ONBOARDING_STORAGE_KEY, nextStep.toString());
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to save step ${stepId}. Please try again.`;
      toast.error('Failed to save', {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps.find((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      {/* Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={7}
        stepLabel={currentStepData?.label || ''}
      />

      {/* Header with Logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <OnboardingStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Step Content */}
        <div className="pb-12">
          {currentStep === 1 && (
            <Step1AccountType
              defaultValues={{ accountType: defaultValues.accountType }}
              onNext={(data) => handleNext(1, data)}
              isLoading={isSaving}
            />
          )}

          {currentStep === 2 && (
            <Step2BusinessDetails
              defaultValues={defaultValues}
              accountType={defaultValues.accountType}
              onNext={(data) => handleNext(2, data)}
              onBack={handleBack}
              isLoading={isSaving}
            />
          )}

          {currentStep === 3 && (
            <Step3ProfileMedia
              defaultValues={{
                profilePhotoUrl: defaultValues.profilePhotoUrl,
                logoUrl: defaultValues.logoUrl,
                coverPhotoUrl: defaultValues.coverPhotoUrl,
              }}
              onNext={(data) => handleNext(3, data)}
              onBack={handleBack}
              isLoading={isSaving}
            />
          )}

          {currentStep === 4 && (
            <Step4BrandCustomization
              defaultValues={{
                brandColorPrimary: defaultValues.brandColorPrimary,
                brandColorSecondary: defaultValues.brandColorSecondary,
                brandColorAccent: defaultValues.brandColorAccent,
                brandFontHeading: defaultValues.brandFontHeading,
                brandFontBody: defaultValues.brandFontBody,
              }}
              onNext={(data) => handleNext(4, data)}
              onBack={handleBack}
              isLoading={isSaving}
            />
          )}

          {currentStep === 5 && (
            <Step5Policies
              defaultValues={{
                ...defaultValues.policies,
                businessName: defaultValues.businessName,
              }}
              onNext={(data) => handleNext(5, data)}
              onBack={handleBack}
              isLoading={isSaving}
            />
          )}

          {currentStep === 6 && (
            <Step6PaymentSetup
              subscriptionTier={defaultValues.accountType === 'salon' ? 'salon' : 'solo'}
              onNext={() => handleNext(6, {})}
              onBack={handleBack}
            />
          )}

          {currentStep === 7 && (
            <Step8Availability
              onNext={(data) => handleNext(7, data)}
              onBack={handleBack}
              isLoading={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
