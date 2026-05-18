import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface SectionCardProps {
  title: string;
  /** One-line subtitle below the title */
  meta?: string;
  /** Action buttons / badges in the header */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Bordered section card for module detail and workspace views.
 * Use instead of nested Card — provides consistent header + body chrome
 * without a card-in-card violation.
 */
export function SectionCard({ title, meta, actions, className, children }: SectionCardProps) {
  return (
    <section className={cn('min-w-0 rounded-card border border-border/60 bg-background', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          {meta ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
