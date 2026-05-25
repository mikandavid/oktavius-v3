import { type ClassValue } from 'clsx';

import { cn } from './utils';

/** Validation chrome for filled controls — not every field needs `valid`. */
export type ControlValidationState = 'default' | 'invalid' | 'valid';

export const controlDisabledClasses =
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/60';

export const controlFocusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

export const controlHoverClasses = 'hover:bg-muted/80 active:bg-muted/90';

export const filledControlSurfaceClasses = 'rounded-control bg-muted/60 transition-colors';

export const controlInvalidClasses =
  'ring-2 ring-destructive focus-visible:ring-destructive/60 aria-invalid:ring-destructive';

export const controlValidClasses =
  'ring-2 ring-success focus-visible:ring-success/60 data-[valid=true]:ring-success';

export const buttonDisabledClasses =
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

export const buttonFocusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

export const buttonLoadingClasses =
  'data-[loading=true]:pointer-events-none data-[loading=true]:opacity-80';

type ResolveValidationOptions = {
  validationState?: ControlValidationState;
  valid?: boolean;
  invalid?: boolean;
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
};

export function resolveControlValidationState({
  validationState,
  valid,
  invalid,
  'aria-invalid': ariaInvalid,
}: ResolveValidationOptions): ControlValidationState {
  if (validationState && validationState !== 'default') return validationState;
  if (
    invalid ||
    ariaInvalid === true ||
    ariaInvalid === 'true' ||
    ariaInvalid === 'grammar' ||
    ariaInvalid === 'spelling'
  ) {
    return 'invalid';
  }
  if (valid) return 'valid';
  return 'default';
}

export function controlValidationClasses(state: ControlValidationState = 'default') {
  switch (state) {
    case 'invalid':
      return controlInvalidClasses;
    case 'valid':
      return controlValidClasses;
    default:
      return '';
  }
}

export function filledControlClasses(...extra: ClassValue[]) {
  return cn(
    filledControlSurfaceClasses,
    controlHoverClasses,
    controlFocusClasses,
    controlDisabledClasses,
    ...extra,
  );
}

export function filledControlStateClasses(
  options: ResolveValidationOptions,
  ...extra: ClassValue[]
) {
  const validationState = resolveControlValidationState(options);
  return cn(filledControlClasses(), controlValidationClasses(validationState), ...extra);
}
