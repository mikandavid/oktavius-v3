import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { useCallback, useEffect, useRef } from 'react';

import { cn } from '../../lib/utils';
import { type CalendarSource, eventChipClasses } from './calendar-colors';
import { calendarEventDragId, CALENDAR_CLICK_DRAG_THRESHOLD_PX } from './calendar-dnd';
import {
  formatCalendarEventDetailHint,
  type CalendarEvent,
  type CalendarTeamMember,
  eventClickAnchor,
  eventStartDate,
} from './calendar-shared';

export interface CalendarEventChipProps {
  event: CalendarEvent;
  calendars?: CalendarSource[];
  teamMembers?: CalendarTeamMember[];
  compact?: boolean;
  showTime?: boolean;
  draggable?: boolean;
  className?: string;
  onClick?: (event: CalendarEvent, anchor: { x: number; y: number }) => void;
}

export function CalendarEventChip({
  event,
  calendars,
  teamMembers,
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

  const dragStartedRef = useRef(false);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: calendarEventDragId(event.id),
    disabled: !draggable,
    data: { event },
  });

  useEffect(() => {
    if (isDragging) dragStartedRef.current = true;
  }, [isDragging]);

  const handlePointerDown = useCallback(
    (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
      pointerOriginRef.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };
      dragStartedRef.current = false;
      listeners?.onPointerDown?.(pointerEvent);
    },
    [listeners],
  );

  const handlePointerUp = useCallback(
    (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
      const origin = pointerOriginRef.current;
      pointerOriginRef.current = null;
      if (!interactive || !onClick || !origin) return;

      const moved =
        Math.hypot(pointerEvent.clientX - origin.x, pointerEvent.clientY - origin.y) >
        CALENDAR_CLICK_DRAG_THRESHOLD_PX;

      if (!moved && !dragStartedRef.current) {
        onClick(event, eventClickAnchor(pointerEvent.currentTarget));
      }
      dragStartedRef.current = false;
    },
    [event, interactive, onClick],
  );

  const handleClick =
    interactive && !draggable
      ? (clickEvent: React.MouseEvent<HTMLButtonElement>) =>
          onClick!(event, eventClickAnchor(clickEvent.currentTarget))
      : undefined;

  return (
    <button
      ref={draggable ? setNodeRef : undefined}
      type="button"
      onClick={handleClick}
      onPointerDown={draggable ? handlePointerDown : undefined}
      onPointerUp={draggable ? handlePointerUp : undefined}
      disabled={!interactive && !draggable}
      {...(draggable ? attributes : {})}
      className={cn(
        'block w-full truncate rounded-control text-left text-xs font-medium transition-[filter,opacity]',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
        eventChipClasses(event, calendars),
        draggable && 'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'opacity-40',
        !interactive && !draggable && 'cursor-default',
        className,
      )}
      title={formatCalendarEventDetailHint(event, teamMembers) ?? event.title}
    >
      {label}
    </button>
  );
}
