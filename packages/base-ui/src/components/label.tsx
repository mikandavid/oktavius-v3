import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';

import { cn } from '../lib/utils';

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  ref?: React.Ref<React.ComponentRef<typeof LabelPrimitive.Root>>;
}

export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
