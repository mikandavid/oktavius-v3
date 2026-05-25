import * as React from 'react';

import {
  type ControlValidationState,
  filledControlStateClasses,
  resolveControlValidationState,
} from '../lib/controlStates';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: React.Ref<HTMLTextAreaElement>;
  validationState?: ControlValidationState;
  valid?: boolean;
}

export function Textarea({
  className,
  ref,
  validationState,
  valid,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  const resolvedState = resolveControlValidationState({
    validationState,
    valid,
    'aria-invalid': ariaInvalid,
  });

  return (
    <textarea
      ref={ref}
      aria-invalid={resolvedState === 'invalid' ? true : ariaInvalid}
      data-valid={resolvedState === 'valid' ? 'true' : undefined}
      className={cn(
        'flex min-h-[96px] w-full px-3 py-2 text-sm placeholder:text-muted-foreground',
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
