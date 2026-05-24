import type { ReactNode } from 'react';

import { cn } from '@oktavius/base-ui';
import { EmptyStateIcon } from '@/lib/icons';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function EmptyState({ title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border/50 bg-muted/10 px-6 text-center',
        compact ? 'min-h-[132px] py-6' : 'min-h-[200px] py-10',
        className,
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 text-muted-foreground/60">
        <EmptyStateIcon size={16} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground/80">{title}</p>
        {description ? (
          <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground/70">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
