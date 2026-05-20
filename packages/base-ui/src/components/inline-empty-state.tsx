import { cn } from '../lib/utils';

export interface InlineEmptyStateProps {
  text: string;
  centered?: boolean;
  className?: string;
}

/** Dashed-border empty state for use within a SectionCard when a sub-list has no items. */
export function InlineEmptyState({ text, centered = false, className }: InlineEmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-border/60 px-3 py-4 text-sm text-muted-foreground',
        centered && 'py-6 text-center',
        className,
      )}
    >
      {text}
    </div>
  );
}
