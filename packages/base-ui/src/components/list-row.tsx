import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export type ListRowVariant = 'default' | 'muted' | 'warning' | 'dashed';

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Left slot — avatar, icon, checkbox */
  leading?: ReactNode;
  /** Right slot — badge, actions, chevron */
  trailing?: ReactNode;
  variant?: ListRowVariant;
  onClick?: () => void;
  className?: string;
  /**
   * When `onClick` is set AND `leadingIsInteractive` is true, `leading` sits
   * outside the clickable button — use this for checkbox rows.
   */
  leadingIsInteractive?: boolean;
}

/**
 * Card-style list row for items within a section (parties, tasks, events, docs).
 * Not a data-grid row — use CrudTable for sortable paginated lists.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  variant = 'default',
  onClick,
  className,
  leadingIsInteractive = false,
}: ListRowProps) {
  const shellClass = cn(
    'flex w-full min-w-0 items-center gap-3 py-2.5 text-left transition-colors',
    variant === 'default' &&
      'border-b border-border/50 last:border-b-0 hover:bg-muted/40 px-2 -mx-2',
    variant === 'muted' &&
      'border-b border-border/40 last:border-b-0 hover:bg-muted/30 px-2 -mx-2',
    variant === 'warning' &&
      'rounded-control border border-warning/30 bg-warning/10 hover:bg-warning/15 px-3',
    variant === 'dashed' &&
      'rounded-control border border-dashed border-border/60 hover:border-border/80 hover:bg-muted/20 px-3',
    className,
  );

  const textBlock = (
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-foreground">{title}</div>
      {subtitle ? (
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>
      ) : null}
    </div>
  );

  if (onClick && leadingIsInteractive) {
    return (
      <div className={shellClass}>
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-md border-0 bg-transparent p-0 text-left shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {textBlock}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </button>
      </div>
    );
  }

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={shellClass}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      {textBlock}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </Comp>
  );
}
