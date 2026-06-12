import { SectionCard } from '@oktavius/base-ui';
import { formatDisplayDateTime } from '@oktavius/base-ui';

import type { AgentTimelineCardPayload, AgentTimelineEvent } from '../types';

type AgentTimelineCardProps = AgentTimelineCardPayload & {
  className?: string;
} & Record<string, unknown>;

function normalizeEvents(props: Record<string, unknown>): AgentTimelineEvent[] {
  const raw = props.events ?? props.timeline ?? props.entries;
  return Array.isArray(raw) ? (raw as AgentTimelineEvent[]) : [];
}

export function AgentTimelineCard(props: AgentTimelineCardProps) {
  const events = props.events ?? normalizeEvents(props);
  const title = (props.title as string | undefined) ?? 'Timeline';

  return (
    <SectionCard className={props.className} title={title} meta={`${events.length} events`}>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground">No events.</p>
      ) : (
        <div className="relative max-h-52 space-y-3 overflow-y-auto pl-4">
          <div className="absolute bottom-1 left-[7px] top-1 w-px bg-border" />
          {events.slice(0, 15).map((event, index) => {
            const date = event.date ?? event.timestamp;
            const label = event.title ?? event.description ?? event.type ?? 'Event';
            return (
              <div key={`${label}-${index}`} className="relative">
                <div className="absolute -left-4 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-primary/60" />
                <div className="text-sm font-medium">{label}</div>
                {date ? (
                  <div className="text-xs text-muted-foreground">{formatDisplayDateTime(date)}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default AgentTimelineCard;

export function normalizeTimelineProps(props: Record<string, unknown>): AgentTimelineCardPayload {
  if (props.kind === 'timeline') return props as AgentTimelineCardPayload;
  return {
    kind: 'timeline',
    title: props.title as string | undefined,
    events: normalizeEvents(props),
  };
}
