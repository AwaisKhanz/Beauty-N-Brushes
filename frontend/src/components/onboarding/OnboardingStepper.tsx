'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: number;
  label: string;
  description: string;
  completed: boolean;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function OnboardingStepper({ steps, currentStep, onStepClick }: OnboardingStepperProps) {
  return (
    <div className="w-full">
      {/* ===== Desktop Stepper ===== */}
      <div className="hidden lg:block">
        <div className="relative w-full py-12">
          {/* Background Progress Line */}
          <div className="absolute top-[40%] left-16 right-16 h-[3px] bg-border rounded-full  z-0" />

          {/* Active Progress Line */}
          <div
            className="absolute top-[40%] left-16 right-16 h-[3px] bg-primary rounded-full transition-all duration-700 ease-out -translate-y-1/2 z-0"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />

          {/* Steps Container */}
          <div className="relative flex items-center justify-between w-full z-10">
            {steps.map((step) => {
              const isCurrent = step.id === currentStep;
              const isCompleted = step.completed;
              const isClickable = step.id <= currentStep || isCompleted;

              return (
                <div key={step.id} className="flex flex-col items-center  group relative">
                  {/* Step Circle */}
                  <button
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      'relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300 flex-shrink-0 bg-background z-10',
                      'hover:scale-110 active:scale-95',
                      isCurrent && [
                        'border-primary bg-primary  text-primary-foreground',
                        'shadow-xl shadow-primary/30 ',
                        'ring-4 ring-primary/20 ',
                      ],
                      isCompleted &&
                        !isCurrent && [
                          'border-primary bg-primary  text-primary-foreground',
                          'hover:shadow-lg hover:shadow-primary/20',
                        ],
                      !isCurrent &&
                        !isCompleted && [
                          'border-border bg-background text-muted-foreground ',
                          'hover:border-primary/50 hover:text-foreground',
                        ],
                      isClickable && 'cursor-pointer',
                      !isClickable && 'cursor-not-allowed opacity-90 '
                    )}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="h-7 w-7" />
                    ) : isCurrent ? (
                      <div className="h-3 w-3 bg-primary-foreground rounded-full animate-pulse" />
                    ) : (
                      <span className="text-lg font-bold ">{step.id}</span>
                    )}
                  </button>

                  {/* Step Label */}
                  <div className="mt-6 text-center">
                    <p
                      className={cn(
                        'text-sm font-semibold transition-colors duration-300',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Mobile Stepper ===== */}
      <div className="lg:hidden space-y-3 px-4 py-6">
        {steps.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.completed;
          const isClickable = step.id <= currentStep || isCompleted;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex items-start gap-4 p-5 rounded-xl border-2 transition-all w-full text-left',
                'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                isCurrent && ['border-primary bg-primary/5', 'shadow-lg shadow-primary/15'],
                isCompleted &&
                  !isCurrent && [
                    'border-primary/40 bg-background',
                    'hover:border-primary/60 hover:bg-primary/5',
                  ],
                !isCurrent &&
                  !isCompleted && [
                    'border-border bg-background',
                    'hover:border-primary/30 hover:bg-muted/40',
                  ],
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-not-allowed opacity-40'
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full border-2 flex-shrink-0 transition-all duration-300',
                  isCurrent && [
                    'border-primary bg-primary text-primary-foreground',
                    'shadow-lg shadow-primary/20',
                  ],
                  isCompleted &&
                    !isCurrent && ['border-primary bg-primary text-primary-foreground'],
                  !isCurrent &&
                    !isCompleted && ['border-border text-muted-foreground', 'bg-background']
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="h-6 w-6" />
                ) : isCurrent ? (
                  <div className="h-3 w-3 bg-primary-foreground rounded-full animate-pulse" />
                ) : (
                  <span className="text-base font-bold">{step.id}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors duration-300',
                    isCurrent ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Status Indicator */}
              {isCurrent && (
                <div className="flex items-center flex-shrink-0 pt-1">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
