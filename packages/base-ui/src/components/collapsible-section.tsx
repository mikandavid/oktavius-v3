import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { CaretRight } from '@phosphor-icons/react';
import * as React from 'react';

import { cn } from '../lib/utils';

export interface CollapsibleSectionProps {
  title: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** `plain` = no border, flat style for sidebar / narrow panels */
  variant?: 'default' | 'plain';
}

export function CollapsibleSection({
  title,
  badge,
  actions,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
  className,
  variant = 'default',
}: CollapsibleSectionProps) {
  const isPlain = variant === 'plain';
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <CollapsiblePrimitive.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn(isPlain ? '' : 'rounded-card bg-card', className)}
    >
      <div
        className={cn('flex w-full items-stretch gap-2 text-sm font-medium', isPlain ? '' : 'px-4')}
      >
        <CollapsiblePrimitive.Trigger asChild>
          <button
            type="button"
            className={cn(
              'flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-3 text-left transition-colors',
              isPlain
                ? 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                : 'text-foreground hover:bg-muted/40 hover:text-foreground',
            )}
          >
            <CaretRight
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                isOpen && 'rotate-90',
              )}
            />
            <span className="min-w-0 flex-1 truncate">{title}</span>
          </button>
        </CollapsiblePrimitive.Trigger>
        {badge ? <span className="shrink-0 self-center">{badge}</span> : null}
        {actions ? <span className="shrink-0 self-center">{actions}</span> : null}
      </div>
      <CollapsiblePrimitive.Content>
        <div className={cn(isPlain ? 'pt-2 pb-1' : 'px-4 pb-3 pt-1 border-t border-border/50')}>
          {children}
        </div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
