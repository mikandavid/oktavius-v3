import type { ReactNode } from 'react';

import { getSemanticToneClasses } from '../lib/semanticPalette';
import { cn } from '../lib/utils';

/** Responsive grid for StatCard rows — 2 → 3 → 6 columns, max 6 cards per row. */
export const STAT_CARD_GRID_CLASS = 'grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6';

export type StatCardTrend = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Formatted delta string e.g. "+12%" or "−3" */
  delta?: string;
  /** Drives delta color — up=success, down=destructive, neutral=muted */
  trend?: StatCardTrend;
  /** Icon in top-right corner */
  icon?: ReactNode;
  /** Secondary descriptor below value */
  description?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  trend = 'neutral',
  icon,
  description,
  className,
}: StatCardProps) {
  const deltaClass =
    trend === 'up'
      ? getSemanticToneClasses('success', 'text')
      : trend === 'down'
        ? getSemanticToneClasses('destructive', 'text')
        : getSemanticToneClasses('neutral', 'text');

  return (
    <div
      className={cn(
        'flex min-h-[6.75rem] min-w-0 flex-col justify-between rounded-card bg-card p-4 space-y-1',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon ? <div className="shrink-0 text-muted-foreground/60">{icon}</div> : null}
      </div>
      <div className="min-w-0 text-xl font-semibold leading-tight tabular-nums tracking-tight text-foreground xl:text-2xl">
        {value}
      </div>
      <div className="flex items-center gap-2">
        {delta ? <span className={cn('text-xs font-medium', deltaClass)}>{delta}</span> : null}
        {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
      </div>
    </div>
  );
}
