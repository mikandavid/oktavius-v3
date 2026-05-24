import { startOfDay } from 'date-fns';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { type CalendarSource, visibleEvents } from './calendar-colors';
import { CalendarEventChip } from './calendar-event-chip';
import { CalendarSourceLegend } from './calendar-source-legend';
import { CalendarTimeGrid } from './calendar-time-grid';
import { CalendarToolbar } from './calendar-toolbar';
import { AgendaList } from './agenda-list';
import {
  CALENDAR_WEEKDAY_LABELS,
  type CalendarEvent,
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

const MAX_VISIBLE_EVENTS = 4;

export interface CalendarViewProps {
  anchor: Date;
  onAnchorChange: (next: Date) => void;
  view?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  events?: CalendarEvent[];
  calendars?: CalendarSource[];
  onCalendarVisibilityChange?: (calendarId: string, visible: boolean) => void;
  /** Show calendar color legend sidebar (Google-style) */
  showCalendarLegend?: boolean;
  leadingAction?: ReactNode;
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (day: Date) => void;
  onSlotClick?: (day: Date, time: string) => void;
  className?: string;
}

function MonthGrid({
  anchor,
  events,
  calendars,
  onEventClick,
  onDayClick,
}: {
  anchor: Date;
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  onEventClick?: (event: CalendarEvent) => void;
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
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day);
          const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex min-h-[7.5rem] flex-col bg-card p-1.5',
                isOutsideMonth(day, anchor) && 'bg-muted/15 text-muted-foreground/60',
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
                    compact
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
        })}
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
  onCalendarVisibilityChange,
  showCalendarLegend = false,
  leadingAction,
  startHour = DEFAULT_SCHEDULER_START_HOUR,
  endHour = DEFAULT_SCHEDULER_END_HOUR,
  slotMinutes = DEFAULT_SLOT_MINUTES,
  onEventClick,
  onDayClick,
  onSlotClick,
  className,
}: CalendarViewProps) {
  const filteredEvents = visibleEvents(events, calendars);
  const weekDays = getWeekDays(anchor);
  const dayAnchor = startOfDay(anchor);

  const handleDayClick = onDayClick
    ? onDayClick
    : onViewChange
      ? (day: Date) => {
          onAnchorChange(day);
          onViewChange('day');
        }
      : undefined;

  return (
    <div className={cn(schedulingShellClass, className)}>
      <CalendarToolbar
        anchor={anchor}
        view={view}
        onAnchorChange={onAnchorChange}
        onViewChange={onViewChange}
        leadingAction={leadingAction}
      />

      <div className="flex min-h-[28rem]">
        {showCalendarLegend && calendars && calendars.length > 0 ? (
          <aside className="hidden w-52 shrink-0 border-r border-border/40 p-4 lg:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Calendars
            </p>
            <CalendarSourceLegend calendars={calendars} onToggle={onCalendarVisibilityChange} />
          </aside>
        ) : null}

        <div
          className={cn(
            'min-w-0 flex-1',
            view === 'agenda' ? '' : cn(schedulingBodyClass, view !== 'month' && 'overflow-x-auto'),
          )}
        >
          {view === 'month' ? (
            <MonthGrid
              anchor={anchor}
              events={filteredEvents}
              calendars={calendars}
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
                onEventClick={onEventClick}
                onSlotClick={onSlotClick}
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
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          ) : null}

          {view === 'agenda' ? (
            <AgendaList
              embedded
              events={filteredEvents}
              calendars={calendars}
              onEventClick={onEventClick}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
