import { useDraggable, useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { useCallback, useRef, useState, type ReactNode, type RefObject } from 'react';

import { cn } from '../../lib/utils';
import { type CalendarSource, eventBlockClasses } from './calendar-colors';
import {
  calendarDayDropId,
  calendarEventDragId,
  calendarSlotDropId,
  normalizeSlotRange,
  pointerYToSlotTime,
  resizeCalendarEvent,
  slotRangeLayout,
  type CalendarEventResizeTarget,
} from './calendar-dnd';
import {
  CALENDAR_WEEKDAY_LABELS,
  clampEventToDayWindow,
  type CalendarEvent,
  DEFAULT_SCHEDULER_END_HOUR,
  DEFAULT_SCHEDULER_START_HOUR,
  DEFAULT_SLOT_MINUTES,
  eventsForDay,
  eventStartDate,
  isToday,
  schedulingColumnHeaderClass,
  schedulingTimeLabelClass,
} from './calendar-shared';

function buildTimeSlots(startHour: number, endHour: number, slotMinutes: number): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += slotMinutes) {
      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return slots;
}

function currentTimeIndicatorTop(day: Date, startHour: number, endHour: number): number | null {
  const now = new Date();
  if (!isToday(day)) return null;

  const totalMinutes = (endHour - startHour) * 60;
  const minutes = (now.getHours() - startHour) * 60 + now.getMinutes();
  if (minutes < 0 || minutes > totalMinutes) return null;
  return (minutes / totalMinutes) * 100;
}

function EventResizeHandle({
  edge,
  onPointerDown,
}: {
  edge: 'start' | 'end';
  onPointerDown: (event: React.PointerEvent<HTMLSpanElement>) => void;
}) {
  return (
    <span
      role="separator"
      aria-orientation="horizontal"
      aria-label={edge === 'start' ? 'Resize start time' : 'Resize end time'}
      onPointerDown={onPointerDown}
      className={cn(
        'absolute inset-x-0 z-20 h-2 touch-none opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100',
        edge === 'start' ? 'top-0 cursor-n-resize' : 'bottom-0 cursor-s-resize',
      )}
    >
      <span
        className={cn(
          'absolute inset-x-3 h-0.5 rounded-full bg-current opacity-60',
          edge === 'start' ? 'top-0.5' : 'bottom-0.5',
        )}
      />
    </span>
  );
}

function TimedEventBlock({
  event,
  day,
  calendars,
  startHour,
  endHour,
  slotMinutes,
  columnRef,
  draggable,
  resizable,
  onEventClick,
  onEventResize,
}: {
  event: CalendarEvent;
  day: Date;
  calendars?: CalendarSource[];
  startHour: number;
  endHour: number;
  slotMinutes: number;
  columnRef: RefObject<HTMLDivElement | null>;
  draggable: boolean;
  resizable: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onEventResize?: (event: CalendarEvent, target: CalendarEventResizeTarget) => void;
}) {
  const [previewTarget, setPreviewTarget] = useState<CalendarEventResizeTarget | null>(null);
  const displayEvent = previewTarget
    ? resizeCalendarEvent(event, previewTarget, slotMinutes)
    : event;
  const layout = clampEventToDayWindow(displayEvent, day, startHour, endHour);
  const start = eventStartDate(displayEvent);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: calendarEventDragId(event.id),
    disabled: !draggable,
    data: { event },
  });

  const handleResizePointerDown = useCallback(
    (edge: 'start' | 'end') => (pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
      pointerEvent.stopPropagation();
      pointerEvent.preventDefault();
      if (!resizable || !onEventResize || !columnRef.current) return;

      const handle = pointerEvent.currentTarget;
      handle.setPointerCapture(pointerEvent.pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        if (!columnRef.current) return;
        const time = pointerYToSlotTime(
          moveEvent.clientY,
          columnRef.current,
          startHour,
          endHour,
          slotMinutes,
        );
        setPreviewTarget({ edge, time });
      };

      const handleUp = (upEvent: PointerEvent) => {
        if (columnRef.current) {
          const time = pointerYToSlotTime(
            upEvent.clientY,
            columnRef.current,
            startHour,
            endHour,
            slotMinutes,
          );
          onEventResize(event, { edge, time });
        }
        setPreviewTarget(null);
        handle.releasePointerCapture(upEvent.pointerId);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [columnRef, endHour, event, onEventResize, resizable, slotMinutes, startHour],
  );

  if (!layout) return null;

  return (
    <button
      ref={draggable ? setNodeRef : undefined}
      type="button"
      onClick={onEventClick ? () => onEventClick(event) : undefined}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className={cn(
        'group absolute inset-x-1.5 z-10 overflow-hidden rounded-control px-2 py-1 text-left text-[11px] font-medium leading-tight',
        eventBlockClasses(event, calendars),
        draggable && 'cursor-grab touch-none active:cursor-grabbing',
        resizable && 'select-none',
        isDragging && 'pointer-events-none opacity-40',
        previewTarget && 'ring-2 ring-ring/30',
      )}
      style={{
        top: `${layout.topPct}%`,
        height: `${layout.heightPct}%`,
        minHeight: '1.35rem',
      }}
      title={event.title}
      data-calendar-event
    >
      {resizable ? (
        <>
          <EventResizeHandle edge="start" onPointerDown={handleResizePointerDown('start')} />
          <EventResizeHandle edge="end" onPointerDown={handleResizePointerDown('end')} />
        </>
      ) : null}
      <span className="block truncate font-semibold">{event.title}</span>
      {start ? (
        <span className="block truncate text-[10px] opacity-90">{format(start, 'HH:mm')}</span>
      ) : null}
    </button>
  );
}

function DraggableAllDayEvent({
  event,
  calendars,
  draggable,
  onEventClick,
}: {
  event: CalendarEvent;
  calendars?: CalendarSource[];
  draggable: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: calendarEventDragId(event.id),
    disabled: !draggable,
    data: { event },
  });

  return (
    <button
      ref={draggable ? setNodeRef : undefined}
      type="button"
      onClick={onEventClick ? () => onEventClick(event) : undefined}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className={cn(
        'block w-full truncate rounded-control px-2 py-1 text-left text-[11px] font-medium',
        eventBlockClasses(event, calendars),
        draggable && 'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      {event.title}
    </button>
  );
}

function AllDayDropCell({
  day,
  events,
  calendars,
  draggable,
  onEventClick,
}: {
  day: Date;
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  draggable: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: calendarDayDropId(day),
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[2.25rem] space-y-1 border-l border-border/40 px-2 py-1.5',
        draggable && isOver && 'bg-muted/30 ring-2 ring-inset ring-ring/20',
      )}
    >
      {events.map((event) => (
        <DraggableAllDayEvent
          key={event.id}
          event={event}
          calendars={calendars}
          draggable={draggable}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  );
}

function DroppableDayColumn({
  day,
  draggable,
  children,
}: {
  day: Date;
  draggable: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: calendarDayDropId(day),
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative border-l border-border/40 bg-card',
        draggable && isOver && 'bg-muted/20 ring-2 ring-inset ring-ring/20',
      )}
    >
      {children}
    </div>
  );
}

function DroppableTimeSlot({
  day,
  slot,
  slotHeightRem,
  draggable,
}: {
  day: Date;
  slot: string;
  slotHeightRem: number;
  draggable: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: calendarSlotDropId(day, slot),
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'block w-full border-t border-border/20 transition-colors',
        draggable && isOver && 'bg-muted/40',
      )}
      style={{ height: `${slotHeightRem}rem` }}
      data-calendar-slot={slot}
    />
  );
}

function DayTimeColumn({
  day,
  dayEvents,
  slots,
  slotHeightRem,
  startHour,
  endHour,
  slotMinutes,
  calendars,
  nowTop,
  draggable,
  resizable,
  onEventClick,
  onEventResize,
  onSlotClick,
  onSlotRangeSelect,
}: {
  day: Date;
  dayEvents: CalendarEvent[];
  slots: string[];
  slotHeightRem: number;
  startHour: number;
  endHour: number;
  slotMinutes: number;
  calendars?: CalendarSource[];
  nowTop: number | null;
  draggable: boolean;
  resizable: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onEventResize?: (event: CalendarEvent, target: CalendarEventResizeTarget) => void;
  onSlotClick?: (day: Date, time: string) => void;
  onSlotRangeSelect?: (day: Date, startTime: string, endTime: string) => void;
}) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [slotPreview, setSlotPreview] = useState<{ start: string; end: string } | null>(null);
  const slotInteractive = Boolean(onSlotClick || onSlotRangeSelect);
  const previewLayout =
    slotPreview && slotInteractive
      ? slotRangeLayout(slotPreview.start, slotPreview.end, startHour, endHour)
      : null;

  const handleColumnPointerDown = useCallback(
    (pointerEvent: React.PointerEvent<HTMLDivElement>) => {
      if (!slotInteractive || !columnRef.current) return;
      if ((pointerEvent.target as HTMLElement).closest('[data-calendar-event]')) return;

      const column = columnRef.current;
      const startTime = pointerYToSlotTime(
        pointerEvent.clientY,
        column,
        startHour,
        endHour,
        slotMinutes,
      );
      const originY = pointerEvent.clientY;
      let latestTime = startTime;
      let moved = false;

      column.setPointerCapture(pointerEvent.pointerId);
      setSlotPreview({ start: startTime, end: startTime });

      const handleMove = (moveEvent: PointerEvent) => {
        if (!columnRef.current) return;
        if (Math.abs(moveEvent.clientY - originY) > 4) moved = true;
        latestTime = pointerYToSlotTime(
          moveEvent.clientY,
          columnRef.current,
          startHour,
          endHour,
          slotMinutes,
        );
        setSlotPreview({ start: startTime, end: latestTime });
      };

      const handleUp = (upEvent: PointerEvent) => {
        setSlotPreview(null);
        column.releasePointerCapture(upEvent.pointerId);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);

        if (moved && onSlotRangeSelect) {
          const range = normalizeSlotRange(startTime, latestTime, slotMinutes);
          onSlotRangeSelect(day, range.start, range.end);
          return;
        }

        if (onSlotClick) {
          onSlotClick(day, startTime);
        }
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [day, endHour, onSlotClick, onSlotRangeSelect, slotInteractive, slotMinutes, startHour],
  );

  return (
    <DroppableDayColumn day={day} draggable={draggable}>
      <div
        ref={columnRef}
        className={cn('relative', slotInteractive && 'cursor-cell touch-none select-none')}
        onPointerDown={slotInteractive ? handleColumnPointerDown : undefined}
      >
        {slots.map((slot) => (
          <DroppableTimeSlot
            key={slot}
            day={day}
            slot={slot}
            slotHeightRem={slotHeightRem}
            draggable={draggable}
          />
        ))}

        {previewLayout ? (
          <div
            className="pointer-events-none absolute inset-x-1.5 z-[5] rounded-control border-2 border-cta/50 bg-cta/15"
            style={{
              top: `${previewLayout.topPct}%`,
              height: `${previewLayout.heightPct}%`,
              minHeight: '0.75rem',
            }}
          />
        ) : null}

        {nowTop !== null ? (
          <div
            className="pointer-events-none absolute inset-x-0 z-20"
            style={{ top: `${nowTop}%` }}
          >
            <div className="relative">
              <span className="absolute -left-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
              <div className="h-0.5 bg-destructive" />
            </div>
          </div>
        ) : null}

        {dayEvents.map((event) => (
          <TimedEventBlock
            key={event.id}
            event={event}
            day={day}
            calendars={calendars}
            startHour={startHour}
            endHour={endHour}
            slotMinutes={slotMinutes}
            columnRef={columnRef}
            draggable={draggable}
            resizable={resizable}
            onEventClick={onEventClick}
            onEventResize={onEventResize}
          />
        ))}
      </div>
    </DroppableDayColumn>
  );
}

export interface CalendarTimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  draggable?: boolean;
  resizable?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onEventResize?: (event: CalendarEvent, target: CalendarEventResizeTarget) => void;
  onSlotClick?: (day: Date, time: string) => void;
  onSlotRangeSelect?: (day: Date, startTime: string, endTime: string) => void;
  className?: string;
}

export function CalendarTimeGrid({
  days,
  events,
  calendars,
  startHour = DEFAULT_SCHEDULER_START_HOUR,
  endHour = DEFAULT_SCHEDULER_END_HOUR,
  slotMinutes = DEFAULT_SLOT_MINUTES,
  draggable = false,
  resizable = false,
  onEventClick,
  onEventResize,
  onSlotClick,
  onSlotRangeSelect,
  className,
}: CalendarTimeGridProps) {
  const slots = buildTimeSlots(startHour, endHour, slotMinutes);
  const slotHeightRem = slotMinutes >= 60 ? 3 : 2;
  const slotsPerHour = 60 / slotMinutes;
  const columnTemplate =
    days.length === 1 ? '4rem minmax(0, 1fr)' : `4rem repeat(${days.length}, minmax(0, 1fr))`;

  const allDayByDay = days.map((day) => eventsForDay(events, day).filter((e) => e.allDay));
  const hasAllDay = allDayByDay.some((list) => list.length > 0);

  return (
    <div className={cn('overflow-hidden rounded-control', className)}>
      <div
        className="grid border-t border-border/40"
        style={{ gridTemplateColumns: columnTemplate }}
      >
        <div className="bg-muted/20" />
        {days.map((day) => (
          <div key={day.toISOString()} className={schedulingColumnHeaderClass}>
            {days.length > 1 ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {CALENDAR_WEEKDAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </p>
            ) : null}
            <span
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                isToday(day) && 'bg-cta text-cta-foreground',
                days.length === 1 && !isToday(day) && 'text-2xl font-normal',
              )}
            >
              {day.getDate()}
            </span>
            {days.length === 1 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{format(day, 'EEEE')}</p>
            ) : null}
          </div>
        ))}
      </div>

      {hasAllDay ? (
        <div
          className="grid border-t border-border/40 bg-muted/10"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div className="flex items-start border-r border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            All day
          </div>
          {days.map((day, index) => (
            <AllDayDropCell
              key={day.toISOString()}
              day={day}
              events={allDayByDay[index]}
              calendars={calendars}
              draggable={draggable}
              onEventClick={onEventClick}
            />
          ))}
        </div>
      ) : null}

      <div className="grid" style={{ gridTemplateColumns: columnTemplate }}>
        <div className="relative bg-muted/10">
          {slots.map((slot, index) =>
            index % slotsPerHour === 0 ? (
              <div
                key={slot}
                className={schedulingTimeLabelClass}
                style={{ height: `${slotHeightRem * slotsPerHour}rem` }}
              >
                {slot}
              </div>
            ) : (
              <div
                key={slot}
                className="border-t border-border/20"
                style={{ height: `${slotHeightRem}rem` }}
              />
            ),
          )}
        </div>

        {days.map((day) => (
          <DayTimeColumn
            key={day.toISOString()}
            day={day}
            dayEvents={eventsForDay(events, day).filter((event) => !event.allDay)}
            slots={slots}
            slotHeightRem={slotHeightRem}
            startHour={startHour}
            endHour={endHour}
            slotMinutes={slotMinutes}
            calendars={calendars}
            nowTop={currentTimeIndicatorTop(day, startHour, endHour)}
            draggable={draggable}
            resizable={resizable}
            onEventClick={onEventClick}
            onEventResize={onEventResize}
            onSlotClick={onSlotClick}
            onSlotRangeSelect={onSlotRangeSelect}
          />
        ))}
      </div>
    </div>
  );
}
