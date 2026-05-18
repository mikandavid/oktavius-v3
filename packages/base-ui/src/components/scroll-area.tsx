import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as React from 'react';

import { cn } from '../lib/utils';

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  ref?: React.Ref<React.ComponentRef<typeof ScrollAreaPrimitive.Root>>;
}

export function ScrollArea({ className, children, ref, ...props }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('group relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export interface ScrollBarProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  ref?: React.Ref<React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>>;
}

export function ScrollBar({ className, orientation = 'vertical', ref, ...props }: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-colors',
        orientation === 'vertical' && 'h-full w-[5px] border-l border-l-transparent p-px',
        orientation === 'horizontal' && 'h-[5px] flex-col border-t border-t-transparent p-px',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border/35 group-hover:bg-border/55" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}
