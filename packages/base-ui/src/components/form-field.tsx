import * as React from 'react';

import { controlValidationClasses, resolveControlValidationState } from '../lib/controlStates';
import { cn } from '../lib/utils';
import { Label } from './label';

export interface FormFieldProps {
  id: string;
  label?: React.ReactNode;
  required?: boolean;
  description?: string;
  error?: string;
  /** Confirmed valid — only when you explicitly want success chrome on the control. */
  valid?: boolean;
  hideLabel?: boolean;
  className?: string;
  children: React.ReactNode;
}

function enhanceControl(
  child: React.ReactNode,
  options: {
    id: string;
    describedBy?: string;
    error?: string;
    valid?: boolean;
  },
) {
  if (!React.isValidElement(child)) return child;

  const validationState = resolveControlValidationState({
    valid: options.valid,
    invalid: Boolean(options.error),
  });

  const childProps = child.props as {
    id?: string;
    className?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'false' | 'grammar' | 'spelling';
    valid?: boolean;
    validationState?: 'default' | 'invalid' | 'valid';
  };

  return React.cloneElement(child, {
    id: childProps.id ?? options.id,
    'aria-describedby': options.describedBy,
    'aria-invalid': options.error ? true : childProps['aria-invalid'],
    valid: options.valid ?? childProps.valid,
    validationState: validationState !== 'default' ? validationState : childProps.validationState,
    className: cn(childProps.className, controlValidationClasses(validationState)),
  } as Record<string, unknown>);
}

/**
 * Wraps a single form control with label, hint, error text, and accessibility wiring.
 * Forwards invalid/valid chrome to the child control when it accepts standard props.
 */
export function FormField({
  id,
  label,
  required = false,
  description,
  error,
  valid,
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
      {enhanceControl(children, { id, describedBy, error, valid })}
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
