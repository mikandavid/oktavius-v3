import * as React from 'react';

import {
  type ControlValidationState,
  filledControlStateClasses,
  resolveControlValidationState,
} from '../lib/controlStates';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
  /** Explicit validation chrome — prefer `aria-invalid` from FormField / EntityForm errors. */
  validationState?: ControlValidationState;
  /** Confirmed valid value (e.g. async check passed). Do not set on every non-empty field. */
  valid?: boolean;
}

export function Input({
  className,
  ref,
  validationState,
  valid,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const resolvedState = resolveControlValidationState({
    validationState,
    valid,
    'aria-invalid': ariaInvalid,
  });

  return (
    <input
      ref={ref}
      aria-invalid={resolvedState === 'invalid' ? true : ariaInvalid}
      data-valid={resolvedState === 'valid' ? 'true' : undefined}
      className={cn(
        'flex h-9 w-full px-3 py-1 text-sm placeholder:text-muted-foreground',
        filledControlStateClasses({
          validationState: resolvedState,
          valid,
          'aria-invalid': ariaInvalid,
        }),
        className,
      )}
      {...props}
    />
  );
}
