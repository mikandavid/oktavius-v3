import { SpinnerGap } from '@phosphor-icons/react';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import {
  buttonDisabledClasses,
  buttonFocusClasses,
  buttonLoadingClasses,
} from '../lib/controlStates';
import { pressableMicroClasses } from '../lib/microInteractions';
import { cn } from '../lib/utils';
import { useMouseTooltip } from './mouse-tooltip';

const buttonVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-control text-sm font-medium',
    pressableMicroClasses,
    buttonFocusClasses,
    buttonDisabledClasses,
    buttonLoadingClasses,
  ),
  {
    variants: {
      variant: {
        default:
          'bg-card text-foreground border border-border/70 hover:bg-muted/60 active:bg-muted/80',
        cta: 'bg-cta text-cta-foreground hover:bg-cta/90 active:bg-cta/80',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
        outline:
          'border border-input bg-background hover:bg-muted hover:text-foreground active:bg-muted/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
        ghost: 'hover:bg-muted hover:text-foreground active:bg-muted/80',
      },
      size: {
        default: 'h-9 px-3.5',
        sm: 'h-7 px-2.5 text-xs',
        lg: 'h-10 px-5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function resolveButtonTooltip(
  tooltip: React.ReactNode | false | undefined,
  size: ButtonProps['size'],
  ariaLabel: string | undefined,
) {
  if (tooltip === false) return undefined;
  if (tooltip != null && tooltip !== '') return tooltip;
  if (size === 'icon' && ariaLabel) return ariaLabel;
  return undefined;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  ref?: React.Ref<HTMLButtonElement>;
  /** Shows spinner, sets disabled, and exposes `aria-busy`. */
  loading?: boolean;
  /** Cursor-following hover label. Icon buttons default to `aria-label` when omitted. Pass `false` to disable. */
  tooltip?: React.ReactNode | false;
}

export function Button({
  className,
  variant,
  size,
  ref,
  tooltip,
  loading = false,
  disabled,
  children,
  'aria-label': ariaLabel,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const resolvedTooltip = resolveButtonTooltip(tooltip, size, ariaLabel);
  const { handlers } = useMouseTooltip(loading ? false : resolvedTooltip);
  const isDisabled = disabled || loading;
  const showLabel = !(loading && size === 'icon');

  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      data-loading={loading ? 'true' : undefined}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size }), className)}
      onMouseEnter={(event) => {
        handlers.onMouseEnter?.(event);
        onMouseEnter?.(event);
      }}
      onMouseMove={(event) => {
        handlers.onMouseMove?.(event);
        onMouseMove?.(event);
      }}
      onMouseLeave={(event) => {
        handlers.onMouseLeave?.();
        onMouseLeave?.(event);
      }}
      {...props}
    >
      {loading ? <SpinnerGap className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
      {showLabel ? children : null}
    </button>
  );
}

export { buttonVariants };
