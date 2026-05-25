import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface SectionCardProps {
  title?: string;
  /** One-line subtitle below the title */
  meta?: ReactNode;
  /** Visual anchor left of the title — logo, avatar, module icon */
  leading?: ReactNode;
  /** Action buttons / badges in the header */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Section card — white tile on the page wash. Borderless. Heading row with
 * bottom rule, padded body. Use for content sections inside module detail pages.
 */
export function SectionCard({
  title,
  meta,
  leading,
  actions,
  className,
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title || meta || actions || leading);

  return (
    <section className={cn('min-w-0 rounded-card bg-card', className)}>
      {hasHeader ? (
        <div className="flex items-end justify-between gap-3 px-4 pt-3 pb-2.5 border-b border-border/50">
          <div className="flex min-w-0 items-center gap-3">
            {leading ? <div className="shrink-0 pb-0.5">{leading}</div> : null}
            <div className="min-w-0">
              {title ? (
                <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
              ) : null}
              {meta ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn('px-4 py-3', !hasHeader && 'pt-4')}>{children}</div>
    </section>
  );
}
