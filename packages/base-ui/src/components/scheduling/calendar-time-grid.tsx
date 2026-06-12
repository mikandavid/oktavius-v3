import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { type ReactNode, type RefObject, useCallback, useMemo, useRef, useState } from 'react';

import { cn } from '../../lib/utils';
import { type CalendarSource, eventBlockClasses } from './calendar-colors';
import {
  CALENDAR_CLICK_DRAG_THRESHOLD_PX,
  type CalendarAllDayColumnRef,
  type CalendarDayColumnRef,
  calendarDayDropId,
  type CalendarEventMoveTarget,
  type CalendarEventResizeTarget,
  moveCalendarEvent,
  normalizeSlotRange,
  pointerToDropTarget,
  pointerYToSlotTime,
  resizeCalendarEvent,
  slotRangeLayout,
} from './calendar-dnd';
import { layoutTimedEventsForDay } from './calendar-event-layout';
import {
  CALENDAR_SNAP_MINUTES,
  CALENDAR_WEEKDAY_LABELS,
  type CalendarEvent,
  type CalendarEventClickHandler,
  type CalendarSlotAnchor,
  clampEventToDayWindow,
  DEFAULT_SCHEDULER_END_HOUR,
  DEFAULT_SCHEDULER_START_HOUR,
  DEFAULT_SLOT_MINUTES,
  eventClickAnchor,
  eventEndDate,
  eventsForDay,
  eventStartDate,
  formatEventTimeRange,
  isMultiDayEvent,
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

type EventDragState = {
  event: CalendarEvent;
  originDay: Date;
  grabOffsetY: number;
};

type EventDragPreview = {
  day: Date;
  target: CalendarEventMoveTarget;
  event: CalendarEvent;
};

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
        'absolute inset-x-0 z-30 touch-none',
        edge === 'start' ? 'top-0 h-2 cursor-n-resize' : 'bottom-0 h-2 cursor-s-resize',
      )}
    />
  );
}

function TimedEventBlock({
  event,
  day,
  calendars,
  layout,
  startHour,
  endHour,
  snapMinutes,
  columnRef,
  draggable,
  resizable,
  isDragging,
  onEventClick,
  onEventResize,
  onDragStart,
}: {
  event: CalendarEvent;
  day: Date;
  calendars?: CalendarSource[];
  layout: { topPct: number; heightPct: number; column: number; columnCount: number };
  startHour: number;
  endHour: number;
  snapMinutes: number;
  columnRef: RefObject<HTMLDivElement | null>;
  draggable: boolean;
  resizable: boolean;
  isDragging: boolean;
  onEventClick?: CalendarEventClickHandler;
  onEventResize?: (event: CalendarEvent, target: CalendarEventResizeTarget) => void;
  onDragStart?: (
    event: CalendarEvent,
    day: Date,
    pointerEvent: React.PointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  const [previewTarget, setPreviewTarget] = useState<CalendarEventResizeTarget | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const displayEvent = previewTarget
    ? resizeCalendarEvent(event, previewTarget, snapMinutes)
    : event;
  const start = eventStartDate(displayEvent);
  const end = eventEndDate(displayEvent);
  const timeLabel =
    start && end && end.getTime() > start.getTime()
      ? `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
      : start
        ? format(start, 'HH:mm')
        : null;

  const widthPct = 100 / layout.columnCount;
  const leftPct = layout.column * widthPct;

  const displayLayout = previewTarget
    ? clampEventToDayWindow(displayEvent, day, startHour, endHour)
    : null;
  const topPct = displayLayout?.topPct ?? layout.topPct;
  const heightPct = displayLayout?.heightPct ?? layout.heightPct;

  const handleResizePointerDown = useCallback(
    (edge: 'start' | 'end') => (pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
      pointerEvent.stopPropagation();
      pointerEvent.preventDefault();
      if (!resizable || !onEventResize || !columnRef.current) return;

      setIsResizing(true);
      const handle = pointerEvent.currentTarget;
      handle.setPointerCapture(pointerEvent.pointerId);

      const handleMove = (moveEvent: PointerEvent) => {
        if (!columnRef.current) return;
        const time = pointerYToSlotTime(
          moveEvent.clientY,
          columnRef.current,
          startHour,
          endHour,
          snapMinutes,
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
            snapMinutes,
          );
          onEventResize(event, { edge, time });
        }
        setPreviewTarget(null);
        setIsResizing(false);
        handle.releasePointerCapture(upEvent.pointerId);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [columnRef, endHour, event, onEventResize, resizable, snapMinutes, startHour],
  );

  const handlePointerDown = useCallback(
    (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
      if (!onDragStart) return;
      if ((pointerEvent.target as HTMLElement).closest('[role="separator"]')) return;
      pointerEvent.stopPropagation();
      onDragStart(event, day, pointerEvent);
    },
    [day, event, onDragStart],
  );

  const handlePointerMove = useCallback(
    (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
      if (isResizing || !resizable) return;
      const rect = pointerEvent.currentTarget.getBoundingClientRect();
      const y = pointerEvent.clientY - rect.top;
      const edgeZone = Math.min(8, rect.height * 0.25);
      if (y <= edgeZone) {
        pointerEvent.currentTarget.style.cursor = 'n-resize';
      } else if (y >= rect.height - edgeZone) {
        pointerEvent.currentTarget.style.cursor = 's-resize';
      } else if (draggable) {
        pointerEvent.currentTarget.style.cursor = 'grab';
      } else {
        pointerEvent.currentTarget.style.cursor = '';
      }
    },
    [draggable, isResizing, resizable],
  );

  const handlePointerLeave = useCallback(
    (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
      if (!isResizing) {
        pointerEvent.currentTarget.style.cursor = draggable ? 'grab' : '';
      }
    },
    [draggable, isResizing],
  );

  const handleClick =
    onEventClick && !onDragStart
      ? (clickEvent: React.MouseEvent<HTMLButtonElement>) =>
          onEventClick(event, eventClickAnchor(clickEvent.currentTarget))
      : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={onDragStart ? handlePointerDown : undefined}
      onPointerMove={resizable ? handlePointerMove : undefined}
      onPointerLeave={resizable ? handlePointerLeave : undefined}
      className={cn(
        'group absolute z-10 overflow-hidden rounded-[4px] px-2 py-1 text-left text-[11px] font-medium leading-tight',
        eventBlockClasses(event, calendars),
        draggable && !isResizing && 'touch-none active:cursor-grabbing',
        resizable && 'select-none',
        isDragging && 'pointer-events-none opacity-30',
        isResizing && 'z-20 shadow-elevated',
      )}
      style={{
        top: `${topPct}%`,
        height: `${heightPct}%`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        minHeight: isResizing ? '0.75rem' : '1.35rem',
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
      <span className="block truncate font-semibold">{displayEvent.title}</span>
      {timeLabel ? (
        <span className="block truncate text-[10px] opacity-90">{timeLabel}</span>
      ) : null}
    </button>
  );
}

function AllDayEventBlock({
  event,
  calendars,
  draggable,
  isDragging,
  onEventClick,
  onDragStart,
}: {
  event: CalendarEvent;
  calendars?: CalendarSource[];
  draggable: boolean;
  isDragging: boolean;
  onEventClick?: CalendarEventClickHandler;
  onDragStart?: (
    event: CalendarEvent,
    day: Date,
    pointerEvent: React.PointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  const spanLabel = isMultiDayEvent(event) ? formatEventTimeRange(event) : null;

  const handlePointerDown = useCallback(
    (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
      if (!onDragStart) return;
      pointerEvent.stopPropagation();
      const day = eventStartDate(event) ?? new Date();
      onDragStart(event, day, pointerEvent);
    },
    [event, onDragStart],
  );

  const handleClick =
    onEventClick && !onDragStart
      ? (clickEvent: React.MouseEvent<HTMLButtonElement>) =>
          onEventClick(event, eventClickAnchor(clickEvent.currentTarget))
      : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={onDragStart ? handlePointerDown : undefined}
      className={cn(
        'block w-full truncate rounded-control px-2 py-1 text-left text-[11px] font-medium shadow-sm',
        eventBlockClasses(event, calendars),
        draggable && 'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'pointer-events-none opacity-30',
      )}
      data-calendar-event
      title={spanLabel ?? event.title}
    >
      <span className="block truncate">{event.title}</span>
      {spanLabel ? (
        <span className="block truncate text-[10px] opacity-90">{spanLabel}</span>
      ) : null}
    </button>
  );
}

function AllDayDropCell({
  day,
  events,
  calendars,
  draggable,
  draggingEventId,
  dragPreview,
  onRegisterAllDayColumn,
  onEventClick,
  onEventDragStart,
}: {
  day: Date;
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  draggable: boolean;
  draggingEventId: string | null;
  dragPreview: EventDragPreview | null;
  onRegisterAllDayColumn: (day: Date, el: HTMLDivElement | null) => void;
  onEventClick?: CalendarEventClickHandler;
  onEventDragStart?: (
    event: CalendarEvent,
    day: Date,
    pointerEvent: React.PointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: calendarDayDropId(day),
    disabled: !draggable,
  });

  const isDropTarget =
    dragPreview?.target.toAllDay && dragPreview.day.toISOString() === day.toISOString();

  const setCellRef = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el);
      onRegisterAllDayColumn(day, el);
    },
    [day, onRegisterAllDayColumn, setNodeRef],
  );

  return (
    <div
      ref={setCellRef}
      className={cn(
        'min-h-[2.25rem] space-y-1 border-l border-border/40 px-2 py-1.5',
        draggable && (isOver || isDropTarget) && 'bg-muted/30 ring-2 ring-inset ring-ring/20',
      )}
    >
      {events.map((event) => (
        <AllDayEventBlock
          key={event.id}
          event={event}
          calendars={calendars}
          draggable={draggable}
          isDragging={draggingEventId === event.id}
          onEventClick={onEventClick}
          onDragStart={onEventDragStart}
        />
      ))}
    </div>
  );
}

function DayColumnShell({ day, children }: { day: Date; children: ReactNode }) {
  return (
    <div
      className="relative border-l border-border/40 bg-card"
      data-calendar-day={day.toISOString()}
    >
      {children}
    </div>
  );
}

function DayTimeColumn({
  day,
  dayEvents,
  eventLayouts,
  slots,
  slotHeightRem,
  startHour,
  endHour,
  snapMinutes,
  calendars,
  nowTop,
  draggable,
  resizable,
  draggingEventId,
  dragPreview,
  onRegisterColumn,
  onEventClick,
  onEventResize,
  onEventDragStart,
  onSlotClick,
  onSlotRangeSelect,
}: {
  day: Date;
  dayEvents: CalendarEvent[];
  eventLayouts: ReturnType<typeof layoutTimedEventsForDay>;
  slots: string[];
  slotHeightRem: number;
  startHour: number;
  endHour: number;
  snapMinutes: number;
  calendars?: CalendarSource[];
  nowTop: number | null;
  draggable: boolean;
  resizable: boolean;
  draggingEventId: string | null;
  dragPreview: EventDragPreview | null;
  onRegisterColumn: (day: Date, el: HTMLDivElement | null) => void;
  onEventClick?: CalendarEventClickHandler;
  onEventResize?: (event: CalendarEvent, target: CalendarEventResizeTarget) => void;
  onEventDragStart?: (
    event: CalendarEvent,
    day: Date,
    pointerEvent: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  onSlotClick?: (day: Date, time: string, anchor: CalendarSlotAnchor) => void;
  onSlotRangeSelect?: (
    day: Date,
    startTime: string,
    endTime: string,
    anchor: CalendarSlotAnchor,
  ) => void;
}) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [slotPreview, setSlotPreview] = useState<{ start: string; end: string } | null>(null);
  const slotInteractive = Boolean(onSlotClick || onSlotRangeSelect);
  const previewLayout =
    slotPreview && slotInteractive
      ? slotRangeLayout(slotPreview.start, slotPreview.end, startHour, endHour)
      : null;

  const setColumnRef = useCallback(
    (el: HTMLDivElement | null) => {
      (columnRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      onRegisterColumn(day, el);
    },
    [day, onRegisterColumn],
  );

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
        snapMinutes,
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
          snapMinutes,
        );
        setSlotPreview({ start: startTime, end: latestTime });
      };

      const handleUp = (upEvent: PointerEvent) => {
        setSlotPreview(null);
        column.releasePointerCapture(pointerEvent.pointerId);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);

        const anchor: CalendarSlotAnchor = { x: upEvent.clientX, y: upEvent.clientY };

        if (moved && onSlotRangeSelect) {
          const range = normalizeSlotRange(startTime, latestTime, snapMinutes);
          onSlotRangeSelect(day, range.start, range.end, anchor);
          return;
        }

        if (onSlotClick) {
          onSlotClick(day, startTime, anchor);
        }
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [day, endHour, onSlotClick, onSlotRangeSelect, slotInteractive, snapMinutes, startHour],
  );

  const showDragGhost =
    dragPreview && dragPreview.day.toISOString() === day.toISOString() && dragPreview.event;

  const ghostLayout = showDragGhost
    ? clampEventToDayWindow(dragPreview.event, day, startHour, endHour)
    : null;

  return (
    <DayColumnShell day={day}>
      <div
        ref={setColumnRef}
        className={cn('relative', slotInteractive && 'cursor-cell touch-none select-none')}
        onPointerDown={slotInteractive ? handleColumnPointerDown : undefined}
      >
        {slots.map((slot) => (
          <div
            key={slot}
            className="block w-full border-t border-border/20"
            style={{ height: `${slotHeightRem}rem` }}
            data-calendar-slot={slot}
          />
        ))}

        {previewLayout ? (
          <div
            className="pointer-events-none absolute inset-x-1.5 z-[5] rounded-control border-2 border-dashed border-cta/60 bg-cta/20"
            style={{
              top: `${previewLayout.topPct}%`,
              height: `${previewLayout.heightPct}%`,
              minHeight: '0.75rem',
            }}
          />
        ) : null}

        {ghostLayout ? (
          <div
            className={cn(
              'pointer-events-none absolute inset-x-1.5 z-[15] rounded-control border-2 border-cta/70 bg-cta/25 opacity-90 shadow-elevated',
              eventBlockClasses(dragPreview!.event, calendars),
            )}
            style={{
              top: `${ghostLayout.topPct}%`,
              height: `${ghostLayout.heightPct}%`,
              minHeight: '1.35rem',
            }}
          />
        ) : null}

        {nowTop !== null ? (
          <div
            className="pointer-events-none absolute inset-x-0 z-20"
            style={{ top: `${nowTop}%` }}
          >
            <div className="relative">
              <span className="absolute -left-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-destructive shadow-sm" />
              <div className="h-0.5 bg-destructive" />
            </div>
          </div>
        ) : null}

        {dayEvents.map((event) => {
          const layout = eventLayouts.get(event.id);
          if (!layout) return null;
          return (
            <TimedEventBlock
              key={event.id}
              event={event}
              day={day}
              calendars={calendars}
              layout={layout}
              startHour={startHour}
              endHour={endHour}
              snapMinutes={snapMinutes}
              columnRef={columnRef}
              draggable={draggable}
              resizable={resizable}
              isDragging={draggingEventId === event.id}
              onEventClick={onEventClick}
              onEventResize={onEventResize}
              onDragStart={onEventDragStart}
            />
          );
        })}
      </div>
    </DayColumnShell>
  );
}

export interface CalendarTimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  snapMinutes?: number;
  draggable?: boolean;
  resizable?: boolean;
  onEventClick?: CalendarEventClickHandler;
  onEventMove?: (event: CalendarEvent, target: CalendarEventMoveTarget) => void;
  onEventResize?: (event: CalendarEvent, target: CalendarEventResizeTarget) => void;
  onSlotClick?: (day: Date, time: string, anchor: CalendarSlotAnchor) => void;
  onSlotRangeSelect?: (
    day: Date,
    startTime: string,
    endTime: string,
    anchor: CalendarSlotAnchor,
  ) => void;
  className?: string;
}

export function CalendarTimeGrid({
  days,
  events,
  calendars,
  startHour = DEFAULT_SCHEDULER_START_HOUR,
  endHour = DEFAULT_SCHEDULER_END_HOUR,
  slotMinutes = DEFAULT_SLOT_MINUTES,
  snapMinutes = CALENDAR_SNAP_MINUTES,
  draggable = false,
  resizable = false,
  onEventClick,
  onEventMove,
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

  const columnElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const allDayElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragState, setDragState] = useState<EventDragState | null>(null);
  const [dragPreview, setDragPreview] = useState<EventDragPreview | null>(null);

  const registerColumn = useCallback((day: Date, el: HTMLDivElement | null) => {
    const key = day.toISOString();
    if (el) columnElementsRef.current.set(key, el);
    else columnElementsRef.current.delete(key);
  }, []);

  const registerAllDayColumn = useCallback((day: Date, el: HTMLDivElement | null) => {
    const key = day.toISOString();
    if (el) allDayElementsRef.current.set(key, el);
    else allDayElementsRef.current.delete(key);
  }, []);

  const getColumnRefs = useCallback((): CalendarDayColumnRef[] => {
    const refs: CalendarDayColumnRef[] = [];
    for (const day of days) {
      const el = columnElementsRef.current.get(day.toISOString());
      if (el) refs.push({ day, el });
    }
    return refs;
  }, [days]);

  const getAllDayColumnRefs = useCallback((): CalendarAllDayColumnRef[] => {
    const refs: CalendarAllDayColumnRef[] = [];
    for (const day of days) {
      const el = allDayElementsRef.current.get(day.toISOString());
      if (el) refs.push({ day, el });
    }
    return refs;
  }, [days]);

  const layoutsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof layoutTimedEventsForDay>>();
    for (const day of days) {
      const dayEvents = eventsForDay(events, day).filter((event) => !event.allDay);
      map.set(day.toISOString(), layoutTimedEventsForDay(dayEvents, day, startHour, endHour));
    }
    return map;
  }, [days, endHour, events, startHour]);

  const handleEventDragStart = useCallback(
    (
      event: CalendarEvent,
      originDay: Date,
      pointerEvent: React.PointerEvent<HTMLButtonElement>,
    ) => {
      if (!onEventMove && !onEventClick) return;
      const target = pointerEvent.currentTarget;
      const rect = target.getBoundingClientRect();
      const grabOffsetY = pointerEvent.clientY - rect.top;
      setDragState({ event, originDay, grabOffsetY });

      const originX = pointerEvent.clientX;
      const originY = pointerEvent.clientY;
      let moved = false;

      const handleMove = (moveEvent: PointerEvent) => {
        if (
          Math.abs(moveEvent.clientX - originX) > CALENDAR_CLICK_DRAG_THRESHOLD_PX ||
          Math.abs(moveEvent.clientY - originY) > CALENDAR_CLICK_DRAG_THRESHOLD_PX
        ) {
          moved = true;
        }

        const dropTarget = pointerToDropTarget(
          moveEvent.clientX,
          moveEvent.clientY,
          getAllDayColumnRefs(),
          getColumnRefs(),
          startHour,
          endHour,
          snapMinutes,
          Boolean(event.allDay),
          grabOffsetY,
        );
        if (!dropTarget) {
          setDragPreview(null);
          return;
        }
        const previewEvent = moveCalendarEvent(event, dropTarget);
        setDragPreview({
          day: dropTarget.day,
          target: dropTarget,
          event: previewEvent,
        });
      };

      const handleUp = (upEvent: PointerEvent) => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        setDragState(null);
        setDragPreview(null);

        const dropTarget = pointerToDropTarget(
          upEvent.clientX,
          upEvent.clientY,
          getAllDayColumnRefs(),
          getColumnRefs(),
          startHour,
          endHour,
          snapMinutes,
          Boolean(event.allDay),
          grabOffsetY,
        );
        if (dropTarget && moved) {
          onEventMove?.(event, dropTarget);
          return;
        }

        if (!moved && onEventClick) {
          onEventClick(event, eventClickAnchor(target));
        }
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [
      endHour,
      getAllDayColumnRefs,
      getColumnRefs,
      onEventClick,
      onEventMove,
      snapMinutes,
      startHour,
    ],
  );

  const allDayByDay = days.map((day) => eventsForDay(events, day).filter((e) => e.allDay));

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
            draggingEventId={dragState?.event.id ?? null}
            dragPreview={dragPreview}
            onRegisterAllDayColumn={registerAllDayColumn}
            onEventClick={onEventClick}
            onEventDragStart={onEventMove || onEventClick ? handleEventDragStart : undefined}
          />
        ))}
      </div>

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
            eventLayouts={layoutsByDay.get(day.toISOString()) ?? new Map()}
            slots={slots}
            slotHeightRem={slotHeightRem}
            startHour={startHour}
            endHour={endHour}
            snapMinutes={snapMinutes}
            calendars={calendars}
            nowTop={currentTimeIndicatorTop(day, startHour, endHour)}
            draggable={draggable}
            resizable={resizable}
            draggingEventId={dragState?.event.id ?? null}
            dragPreview={dragPreview}
            onRegisterColumn={registerColumn}
            onEventClick={onEventClick}
            onEventResize={onEventResize}
            onEventDragStart={onEventMove || onEventClick ? handleEventDragStart : undefined}
            onSlotClick={onSlotClick}
            onSlotRangeSelect={onSlotRangeSelect}
          />
        ))}
      </div>
    </div>
  );
}
