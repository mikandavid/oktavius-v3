import * as React from 'react';

import { Label } from './label';
import { cn } from '../lib/utils';

export interface FormFieldProps {
  id: string;
  label?: React.ReactNode;
  required?: boolean;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps a single form control with label, hint, error text, and accessibility wiring.
 */
export function FormField({
  id,
  label,
  required = false,
  description,
  error,
  hideLabel = false,
  className,
  children,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {!hideLabel && label ? (
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}
      <div aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
        {children}
      </div>
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
