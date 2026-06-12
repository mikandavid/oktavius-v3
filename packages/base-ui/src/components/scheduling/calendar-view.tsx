import { DndContext, type DragEndEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { startOfDay } from 'date-fns';
import { type ReactNode, useState } from 'react';

import { cn } from '../../lib/utils';
import { AgendaList } from './agenda-list';
import { type CalendarSource, visibleEvents } from './calendar-colors';
import {
  calendarDayDropId,
  type CalendarEventMoveTarget,
  type CalendarEventResizeTarget,
  parseCalendarDayDropId,
  parseCalendarEventDragId,
  parseCalendarSlotDropId,
  useCalendarDndSensors,
} from './calendar-dnd';
import { CalendarEventChip } from './calendar-event-chip';
import {
  CALENDAR_WEEKDAY_LABELS,
  type CalendarEvent,
  type CalendarEventClickHandler,
  type CalendarSlotAnchor,
  type CalendarTeamMember,
  type CalendarViewMode,
  DEFAULT_SCHEDULER_END_HOUR,
  DEFAULT_SCHEDULER_START_HOUR,
  DEFAULT_SLOT_MINUTES,
  eventsForDay,
  getMonthGridDays,
  getWeekDays,
  isOutsideMonth,
  isToday,
  schedulingBodyClass,
  schedulingShellClass,
} from './calendar-shared';
import { CalendarSidebar } from './calendar-sidebar';
import { CalendarTimeGrid } from './calendar-time-grid';
import { CalendarToolbar } from './calendar-toolbar';

const MAX_VISIBLE_EVENTS = 4;

export interface CalendarViewProps {
  anchor: Date;
  onAnchorChange: (next: Date) => void;
  view?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  events?: CalendarEvent[];
  calendars?: CalendarSource[];
  /** Resolves attendee ids for tooltips and schedule detail lines. */
  teamMembers?: CalendarTeamMember[];
  /** Checked team members in the sidebar — omit to treat all members as selected. */
  selectedTeamMemberIds?: string[];
  onTeamMemberVisibilityChange?: (memberId: string, visible: boolean) => void;
  onSelectAllTeamMembers?: () => void;
  onClearTeamMembers?: () => void;
  onCalendarVisibilityChange?: (calendarId: string, visible: boolean) => void;
  /** Show left sidebar: team list, calendar legend, mini month picker */
  showSidebar?: boolean;
  /** @deprecated Use `showSidebar` — kept for existing call sites */
  showCalendarLegend?: boolean;
  leadingAction?: ReactNode;
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onEventClick?: CalendarEventClickHandler;
  /** Drag event chips / time blocks to another day or slot. */
  onEventMove?: (event: CalendarEvent, target: CalendarEventMoveTarget) => void;
  /** Drag top/bottom edge of timed events in day/week grid. */
  onEventResize?: (event: CalendarEvent, target: CalendarEventResizeTarget) => void;
  onDayClick?: (day: Date) => void;
  onSlotClick?: (day: Date, time: string, anchor: CalendarSlotAnchor) => void;
  /** Click-drag on empty grid to select a time range (day/week). */
  onSlotRangeSelect?: (
    day: Date,
    startTime: string,
    endTime: string,
    anchor: CalendarSlotAnchor,
  ) => void;
  className?: string;
}

function MonthDayCell({
  day,
  anchor,
  events,
  calendars,
  teamMembers,
  draggable,
  onEventClick,
  onDayClick,
}: {
  day: Date;
  anchor: Date;
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  teamMembers?: CalendarTeamMember[];
  draggable: boolean;
  onEventClick?: CalendarEventClickHandler;
  onDayClick?: (day: Date) => void;
}) {
  const dayEvents = eventsForDay(events, day);
  const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
  const overflow = dayEvents.length - visible.length;
  const { setNodeRef, isOver } = useDroppable({
    id: calendarDayDropId(day),
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[7.5rem] flex-col bg-card p-1.5',
        isOutsideMonth(day, anchor) && 'bg-muted/15 text-muted-foreground/60',
        draggable && isOver && 'bg-muted/30 ring-2 ring-inset ring-ring/20',
      )}
    >
      <button
        type="button"
        onClick={onDayClick ? () => onDayClick(day) : undefined}
        disabled={!onDayClick}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
          isToday(day) && 'bg-cta text-cta-foreground',
          !isToday(day) && 'text-foreground hover:bg-muted/60',
          !onDayClick && 'cursor-default hover:bg-transparent',
        )}
      >
        {day.getDate()}
      </button>
      <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5">
        {visible.map((event) => (
          <CalendarEventChip
            key={event.id}
            event={event}
            calendars={calendars}
            teamMembers={teamMembers}
            compact
            draggable={draggable}
            onClick={onEventClick}
          />
        ))}
        {overflow > 0 ? (
          <button
            type="button"
            className="px-1 text-left text-[10px] font-medium text-muted-foreground hover:text-foreground"
            onClick={onDayClick ? () => onDayClick(day) : undefined}
          >
            +{overflow} more
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MonthGrid({
  anchor,
  events,
  calendars,
  teamMembers,
  draggable,
  onEventClick,
  onDayClick,
}: {
  anchor: Date;
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  teamMembers?: CalendarTeamMember[];
  draggable: boolean;
  onEventClick?: CalendarEventClickHandler;
  onDayClick?: (day: Date) => void;
}) {
  const days = getMonthGridDays(anchor);

  return (
    <>
      <div className="mb-2 grid grid-cols-7">
        {CALENDAR_WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-control bg-border/40">
        {days.map((day) => (
          <MonthDayCell
            key={day.toISOString()}
            day={day}
            anchor={anchor}
            events={events}
            calendars={calendars}
            teamMembers={teamMembers}
            draggable={draggable}
            onEventClick={onEventClick}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </>
  );
}

export function CalendarView({
  anchor,
  onAnchorChange,
  view = 'month',
  onViewChange,
  events = [],
  calendars,
  teamMembers,
  selectedTeamMemberIds,
  onTeamMemberVisibilityChange,
  onSelectAllTeamMembers,
  onClearTeamMembers,
  onCalendarVisibilityChange,
  showSidebar,
  showCalendarLegend = false,
  leadingAction,
  startHour = DEFAULT_SCHEDULER_START_HOUR,
  endHour = DEFAULT_SCHEDULER_END_HOUR,
  slotMinutes = DEFAULT_SLOT_MINUTES,
  onEventClick,
  onEventMove,
  onEventResize,
  onDayClick,
  onSlotClick,
  onSlotRangeSelect,
  className,
}: CalendarViewProps) {
  const draggable = Boolean(onEventMove);
  const resizable = Boolean(onEventResize);
  const sensors = useCalendarDndSensors();
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const filteredEvents = visibleEvents(events, calendars);
  const weekDays = getWeekDays(anchor);
  const dayAnchor = startOfDay(anchor);
  const sidebarVisible =
    showSidebar ??
    (showCalendarLegend || (teamMembers?.length ?? 0) > 0 || (calendars?.length ?? 0) > 0);
  const activeEvent = activeEventId
    ? filteredEvents.find((event) => event.id === activeEventId)
    : null;

  const handleDayClick = onDayClick
    ? onDayClick
    : onViewChange
      ? (day: Date) => {
          onAnchorChange(day);
          onViewChange('day');
        }
      : undefined;

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveEventId(null);
    if (!onEventMove) return;

    const { active, over } = event;
    if (!over) return;

    const eventId = parseCalendarEventDragId(String(active.id));
    if (!eventId) return;

    const moving = filteredEvents.find((entry) => entry.id === eventId);
    if (!moving) return;

    const overId = String(over.id);
    const slotTarget = parseCalendarSlotDropId(overId);
    if (slotTarget) {
      onEventMove(moving, { day: slotTarget.day, time: slotTarget.time });
      return;
    }

    const dayTarget = parseCalendarDayDropId(overId);
    if (dayTarget) {
      onEventMove(moving, { day: dayTarget });
    }
  };

  const calendarBody = (
    <div className="flex min-h-[28rem] flex-col lg:min-h-0 lg:flex-row">
      {sidebarVisible ? (
        <CalendarSidebar
          anchor={anchor}
          view={view}
          onAnchorChange={onAnchorChange}
          teamMembers={teamMembers}
          selectedTeamMemberIds={selectedTeamMemberIds}
          onTeamMemberVisibilityChange={onTeamMemberVisibilityChange}
          onSelectAllTeamMembers={onSelectAllTeamMembers}
          onClearTeamMembers={onClearTeamMembers}
          calendars={calendars}
          onCalendarVisibilityChange={onCalendarVisibilityChange}
        />
      ) : null}

      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        <CalendarToolbar
          anchor={anchor}
          view={view}
          onAnchorChange={onAnchorChange}
          onViewChange={onViewChange}
          leadingAction={leadingAction}
        />

        <div
          className={cn(
            'min-h-0 min-w-0 flex-1',
            view === 'agenda' ? '' : cn(schedulingBodyClass, view !== 'month' && 'overflow-x-auto'),
          )}
        >
          {view === 'month' ? (
            <MonthGrid
              anchor={anchor}
              events={filteredEvents}
              calendars={calendars}
              teamMembers={teamMembers}
              draggable={draggable}
              onEventClick={onEventClick}
              onDayClick={handleDayClick}
            />
          ) : null}

          {view === 'week' ? (
            <div className="min-w-[48rem]">
              <CalendarTimeGrid
                days={weekDays}
                events={filteredEvents}
                calendars={calendars}
                startHour={startHour}
                endHour={endHour}
                slotMinutes={slotMinutes}
                draggable={draggable}
                resizable={resizable}
                onEventClick={onEventClick}
                onEventMove={onEventMove}
                onEventResize={onEventResize}
                onSlotClick={onSlotClick}
                onSlotRangeSelect={onSlotRangeSelect}
              />
            </div>
          ) : null}

          {view === 'day' ? (
            <CalendarTimeGrid
              days={[dayAnchor]}
              events={filteredEvents}
              calendars={calendars}
              startHour={startHour}
              endHour={endHour}
              slotMinutes={slotMinutes}
              draggable={draggable}
              resizable={resizable}
              onEventClick={onEventClick}
              onEventMove={onEventMove}
              onEventResize={onEventResize}
              onSlotClick={onSlotClick}
              onSlotRangeSelect={onSlotRangeSelect}
            />
          ) : null}

          {view === 'agenda' ? (
            <AgendaList
              embedded
              events={filteredEvents}
              calendars={calendars}
              teamMembers={teamMembers}
              onEventClick={onEventClick}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(schedulingShellClass, className)}>
      {draggable ? (
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            const eventId = parseCalendarEventDragId(String(event.active.id));
            setActiveEventId(eventId);
          }}
          onDragEnd={handleDragEnd}
        >
          {calendarBody}
          <DragOverlay dropAnimation={{ duration: 160, easing: 'ease-out' }}>
            {activeEvent ? (
              <CalendarEventChip
                event={activeEvent}
                calendars={calendars}
                teamMembers={teamMembers}
                className="scale-[1.02] shadow-elevated ring-2 ring-ring/30"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        calendarBody
      )}
    </div>
  );
}
