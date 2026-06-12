import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

import { surfaceMicroClasses } from '../lib/microInteractions';
import { cn } from '../lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex w-full flex-wrap items-stretch gap-0 border-b border-border/60 bg-transparent p-0 text-muted-foreground',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    /** Show an attention dot on this tab */
    attention?: boolean;
  }
>(({ className, attention, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative -mb-px inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium ring-offset-background',
      surfaceMicroClasses,
      'transition-[color,border-color] duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:border-border data-[state=inactive]:hover:text-foreground',
      'data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none',
      className,
    )}
    {...props}
  >
    {children}
    {attention ? (
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
    ) : null}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
