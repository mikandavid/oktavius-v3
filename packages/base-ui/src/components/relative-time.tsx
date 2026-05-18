import { formatDistanceToNow, parseISO } from 'date-fns';

import { cn } from '../lib/utils';

export interface RelativeTimeProps {
  /** ISO 8601 date string or Date object */
  date: string | Date;
  /** Show exact date as title tooltip */
  withTitle?: boolean;
  className?: string;
}

/**
 * "3 days ago", "in 2 hours" display using date-fns.
 * Use for activity feeds, timestamps, last-updated indicators.
 */
export function RelativeTime({ date, withTitle = true, className }: RelativeTimeProps) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isNaN(d.getTime())) return <span className={className}>—</span>;

  const relative = formatDistanceToNow(d, { addSuffix: true });
  const absolute = d.toLocaleString();

  return (
    <time
      dateTime={d.toISOString()}
      title={withTitle ? absolute : undefined}
      className={cn('text-muted-foreground', className)}
    >
      {relative}
    </time>
  );
}
