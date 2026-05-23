import { format } from 'date-fns';

import { cn } from '../../lib/utils';
import { type CalendarSource, eventChipClasses } from './calendar-colors';
import { type CalendarEvent, eventStartDate } from './calendar-shared';

export interface CalendarEventChipProps {
  event: CalendarEvent;
  calendars?: CalendarSource[];
  compact?: boolean;
  showTime?: boolean;
  className?: string;
  onClick?: (event: CalendarEvent) => void;
}

export function CalendarEventChip({
  event,
  calendars,
  compact = false,
  showTime = true,
  className,
  onClick,
}: CalendarEventChipProps) {
  const interactive = Boolean(onClick);
  const start = eventStartDate(event);
  const label =
    showTime && !event.allDay && start
      ? `${format(start, 'HH:mm')} ${event.title}`
      : event.title;

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(event) : undefined}
      disabled={!interactive}
      className={cn(
        'block w-full truncate rounded-control text-left text-xs font-medium transition-[filter]',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
        eventChipClasses(event, calendars),
        !interactive && 'cursor-default',
        className,
      )}
      title={event.title}
    >
      {label}
    </button>
  );
}
