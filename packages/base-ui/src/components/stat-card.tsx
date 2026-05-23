import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

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
      ? 'text-success'
      : trend === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <div
      className={cn(
        'rounded-card bg-card p-4 space-y-1',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <div className="shrink-0 text-muted-foreground/60">{icon}</div>
        ) : null}
      </div>
      <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="flex items-center gap-2">
        {delta ? (
          <span className={cn('text-xs font-medium', deltaClass)}>{delta}</span>
        ) : null}
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </div>
    </div>
  );
}
