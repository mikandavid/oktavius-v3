import type { ReactNode } from 'react';

import { formatDisplayDateTime } from '../lib/format-display-date';
import { getSemanticToneClasses, type SemanticTone } from '../lib/semanticPalette';
import { cn } from '../lib/utils';

function formatTimelineTimestamp(value?: string) {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return formatDisplayDateTime(value);
  return value;
}

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
  if (tone === 'default') return getSemanticToneClasses('neutral', 'ring');
  return getSemanticToneClasses(tone as SemanticTone, 'ring');
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
                  event.icon
                    ? 'h-7 w-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground border border-border/60'
                    : dotClass(tone),
                )}
              >
                {event.icon ?? null}
              </div>
              {!isLast ? <div className="mt-1 w-px flex-1 bg-border/50" /> : null}
            </div>

            {/* Content */}
            <div className={cn('min-w-0 flex-1 pb-4', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-4">
                <span className="min-w-0 text-sm font-medium text-foreground">{event.label}</span>
                {event.timestamp ? (
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatTimelineTimestamp(event.timestamp)}
                  </time>
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
