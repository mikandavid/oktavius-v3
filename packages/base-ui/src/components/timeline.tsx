import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export type TimelineEventTone = 'default' | 'success' | 'warning' | 'destructive' | 'info';

export interface TimelineEvent {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  timestamp?: string;
  icon?: ReactNode;
  tone?: TimelineEventTone;
}

function dotClass(tone: TimelineEventTone) {
  switch (tone) {
    case 'success': return 'bg-success border-success/30';
    case 'warning': return 'bg-warning border-warning/30';
    case 'destructive': return 'bg-destructive border-destructive/30';
    case 'info': return 'bg-info border-info/30';
    default: return 'bg-border border-border/60';
  }
}

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <ol className={cn('space-y-0', className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const tone = event.tone ?? 'default';

        return (
          <li key={event.id} className="flex gap-3">
            {/* Spine + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2',
                  event.icon ? 'h-7 w-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground border border-border/60' : dotClass(tone),
                )}
              >
                {event.icon ?? null}
              </div>
              {!isLast ? <div className="mt-1 w-px flex-1 bg-border/50" /> : null}
            </div>

            {/* Content */}
            <div className={cn('min-w-0 pb-4', isLast && 'pb-0')}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-foreground">{event.label}</span>
                {event.timestamp ? (
                  <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                ) : null}
              </div>
              {event.description ? (
                <div className="mt-0.5 text-sm text-muted-foreground">{event.description}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
