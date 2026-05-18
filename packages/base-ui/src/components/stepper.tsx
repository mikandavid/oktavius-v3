import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface StepperStep {
  key: string;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** 0-indexed current step */
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav className={cn('flex items-start gap-0', className)} aria-label="Progress">
      {steps.map((step, index) => {
        const isDone = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.key} className="flex min-w-0 flex-1 items-start">
            {/* Step + connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  isDone && 'border-primary bg-primary text-primary-foreground',
                  isActive && 'border-primary bg-background text-primary',
                  !isDone && !isActive && 'border-border bg-background text-muted-foreground',
                )}
              >
                {isDone ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M1.5 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-1.5 space-y-0.5 text-center">
                <p
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                {step.description ? (
                  <p className="hidden text-xs text-muted-foreground sm:block">{step.description}</p>
                ) : null}
              </div>
            </div>

            {/* Connector line — except last */}
            {!isLast ? (
              <div
                className={cn(
                  'mt-3.5 h-px flex-1 transition-colors',
                  index < currentStep ? 'bg-primary' : 'bg-border',
                )}
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export interface StepperLayoutProps {
  steps: StepperStep[];
  currentStep: number;
  children: ReactNode;
  /** Footer: Back / Next / Submit buttons */
  footer: ReactNode;
  className?: string;
}

export function StepperLayout({
  steps,
  currentStep,
  children,
  footer,
  className,
}: StepperLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <Stepper steps={steps} currentStep={currentStep} />
      <div>{children}</div>
      <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-4">
        {footer}
      </div>
    </div>
  );
}
