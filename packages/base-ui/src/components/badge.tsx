import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { getSemanticToneClasses } from '../lib/semanticPalette';
import { cn } from '../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-badge border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: cn('border-transparent', getSemanticToneClasses('destructive', 'solid')),
        outline: 'text-foreground',
        info: getSemanticToneClasses('info', 'softEmphasis'),
        success: getSemanticToneClasses('success', 'softEmphasis'),
        warning: getSemanticToneClasses('warning', 'softEmphasis'),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
