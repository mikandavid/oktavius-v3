import { Badge, formatDisplayDate, ListRow, SectionCard } from '@oktavius/base-ui';

import { TimeIcon } from '@/lib/icons';

import type { AgentScheduleCardPayload } from '../types';

type AgentScheduleCardProps = AgentScheduleCardPayload & {
  className?: string;
};

function formatTimeRange(startTime: string, endTime?: string) {
  const start = new Date(startTime);
  const startLabel = start.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  if (!endTime) return startLabel;
  const end = new Date(endTime);
  const endLabel = end.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  return `${startLabel} – ${endLabel}`;
}

export function AgentScheduleCard({
  title = 'Schedule',
  subtitle,
  events,
  className,
}: AgentScheduleCardProps) {
  return (
    <SectionCard
      className={className}
      title={title}
      meta={subtitle ?? formatDisplayDate(new Date())}
    >
      <div className="space-y-1">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events scheduled.</p>
        ) : (
          events.map((event) => (
            <ListRow
              key={event.id}
              leading={<TimeIcon size={16} className="text-muted-foreground" />}
              title={event.title}
              subtitle={formatTimeRange(event.startTime, event.endTime)}
              meta={event.type ? <Badge variant="secondary">{event.type}</Badge> : undefined}
            />
          ))
        )}
      </div>
    </SectionCard>
  );
}
