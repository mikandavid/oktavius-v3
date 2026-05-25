import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';

import { cn } from '../../lib/utils';
import { type CalendarSource, eventChipClasses } from './calendar-colors';
import { calendarEventDragId } from './calendar-dnd';
import { type CalendarEvent, eventStartDate } from './calendar-shared';

export interface CalendarEventChipProps {
  event: CalendarEvent;
  calendars?: CalendarSource[];
  compact?: boolean;
  showTime?: boolean;
  draggable?: boolean;
  className?: string;
  onClick?: (event: CalendarEvent) => void;
}

export function CalendarEventChip({
  event,
  calendars,
  compact = false,
  showTime = true,
  draggable = false,
  className,
  onClick,
}: CalendarEventChipProps) {
  const interactive = Boolean(onClick);
  const start = eventStartDate(event);
  const label =
    showTime && !event.allDay && start ? `${format(start, 'HH:mm')} ${event.title}` : event.title;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: calendarEventDragId(event.id),
    disabled: !draggable,
    data: { event },
  });

  return (
    <button
      ref={draggable ? setNodeRef : undefined}
      type="button"
      onClick={onClick ? () => onClick(event) : undefined}
      disabled={!interactive && !draggable}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className={cn(
        'block w-full truncate rounded-control text-left text-xs font-medium transition-[filter,opacity]',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
        eventChipClasses(event, calendars),
        draggable && 'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'opacity-40',
        !interactive && !draggable && 'cursor-default',
        className,
      )}
      title={event.title}
    >
      {label}
    </button>
  );
}
