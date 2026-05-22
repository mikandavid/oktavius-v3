import * as React from 'react';

import { cn } from '../lib/utils';

export type CalendarPreviewEvent = {
  date: string;
  tone?: 'default' | 'primary' | 'warning';
};

export type CalendarMonthPreviewProps = {
  monthLabel: string;
  /** ISO date strings (yyyy-mm-dd) for days in the visible month */
  days: Array<{ date: string; label: string; isToday?: boolean; isOutsideMonth?: boolean }>;
  events?: CalendarPreviewEvent[];
  className?: string;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarMonthPreview({
  monthLabel,
  days,
  events = [],
  className,
}: CalendarMonthPreviewProps) {
  const eventDates = React.useMemo(
    () => new Set(events.map((event) => event.date)),
    [events],
  );

  return (
    <div className={cn('rounded-card border border-border/60 bg-card', className)}>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <p className="text-xs text-muted-foreground">Scheduling preview — static mock</p>
      </div>
      <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border/40 p-px">
        {days.map((day) => {
          const hasEvent = eventDates.has(day.date);
          return (
            <div
              key={day.date}
              className={cn(
                'flex min-h-[4.5rem] flex-col bg-card p-1.5',
                day.isOutsideMonth && 'bg-muted/15 text-muted-foreground/50',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-control text-xs font-medium',
                  day.isToday && 'bg-cta text-cta-foreground',
                  !day.isToday && 'text-foreground',
                )}
              >
                {day.label}
              </span>
              {hasEvent ? (
                <span className="mt-auto h-1.5 w-1.5 rounded-full bg-cta" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
