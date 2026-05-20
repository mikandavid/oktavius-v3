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
 * Section card — white tile on the page wash. Borderless. Heading row with
 * bottom rule, padded body. Use for content sections inside module detail pages.
 */
export function SectionCard({ title, meta, actions, className, children }: SectionCardProps) {
  return (
    <section className={cn('min-w-0 rounded-card bg-card', className)}>
      <div className="flex items-end justify-between gap-3 px-4 pt-3 pb-2.5 border-b border-border/50">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          {meta ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
