import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from '@phosphor-icons/react';
import * as React from 'react';

import { cn } from '../lib/utils';

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  ref?: React.Ref<React.ComponentRef<typeof CheckboxPrimitive.Root>>;
}

export function Checkbox({ className, ref, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm bg-muted/60 ring-offset-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-cta data-[state=checked]:text-cta-foreground',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {props.checked === 'indeterminate' ? (
          <span className="block h-0.5 w-2 rounded-full bg-current" />
        ) : (
          <Check className="h-3 w-3" weight="bold" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
