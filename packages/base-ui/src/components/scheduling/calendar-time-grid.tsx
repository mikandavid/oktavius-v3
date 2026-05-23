import { format } from 'date-fns';

import { cn } from '../../lib/utils';
import { type CalendarSource, eventBlockClasses } from './calendar-colors';
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

export interface CalendarTimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  calendars?: CalendarSource[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (day: Date, time: string) => void;
  className?: string;
}

export function CalendarTimeGrid({
  days,
  events,
  calendars,
  startHour = DEFAULT_SCHEDULER_START_HOUR,
  endHour = DEFAULT_SCHEDULER_END_HOUR,
  slotMinutes = DEFAULT_SLOT_MINUTES,
  onEventClick,
  onSlotClick,
  className,
}: CalendarTimeGridProps) {
  const slots = buildTimeSlots(startHour, endHour, slotMinutes);
  const slotHeightRem = slotMinutes >= 60 ? 3 : 2;
  const slotsPerHour = 60 / slotMinutes;
  const columnTemplate =
    days.length === 1
      ? '4rem minmax(0, 1fr)'
      : `4rem repeat(${days.length}, minmax(0, 1fr))`;

  const allDayByDay = days.map((day) => eventsForDay(events, day).filter((e) => e.allDay));
  const hasAllDay = allDayByDay.some((list) => list.length > 0);

  return (
    <div className={cn('overflow-hidden rounded-control', className)}>
      <div className="grid border-t border-border/40" style={{ gridTemplateColumns: columnTemplate }}>
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
        <div className="grid border-t border-border/40 bg-muted/10" style={{ gridTemplateColumns: columnTemplate }}>
          <div className="flex items-start border-r border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            All day
          </div>
          {days.map((day, index) => (
            <div
              key={day.toISOString()}
              className="min-h-[2.25rem] space-y-1 border-l border-border/40 px-2 py-1.5"
            >
              {allDayByDay[index].map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={onEventClick ? () => onEventClick(event) : undefined}
                  className={cn(
                    'block w-full truncate rounded-control px-2 py-1 text-left text-[11px] font-medium',
                    eventBlockClasses(event, calendars),
                  )}
                >
                  {event.title}
                </button>
              ))}
            </div>
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

        {days.map((day) => {
          const dayEvents = eventsForDay(events, day).filter((event) => !event.allDay);
          const nowTop = currentTimeIndicatorTop(day, startHour, endHour);

          return (
            <div key={day.toISOString()} className="relative border-l border-border/40 bg-card">
              <div className="relative">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    disabled={!onSlotClick}
                    onClick={onSlotClick ? () => onSlotClick(day, slot) : undefined}
                    className={cn(
                      'block w-full border-t border-border/20 transition-colors',
                      onSlotClick && 'hover:bg-muted/30',
                      !onSlotClick && 'cursor-default',
                    )}
                    style={{ height: `${slotHeightRem}rem` }}
                    aria-label={
                      onSlotClick ? `Create event at ${format(day, 'dd.MM.yyyy')} ${slot}` : undefined
                    }
                  />
                ))}

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

                {dayEvents.map((event) => {
                  const layout = clampEventToDayWindow(event, day, startHour, endHour);
                  if (!layout) return null;
                  const start = eventStartDate(event);

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={onEventClick ? () => onEventClick(event) : undefined}
                      className={cn(
                        'absolute inset-x-1.5 z-10 overflow-hidden rounded-control px-2 py-1 text-left text-[11px] font-medium leading-tight',
                        eventBlockClasses(event, calendars),
                      )}
                      style={{
                        top: `${layout.topPct}%`,
                        height: `${layout.heightPct}%`,
                        minHeight: '1.35rem',
                      }}
                      title={event.title}
                    >
                      <span className="block truncate font-semibold">{event.title}</span>
                      {start ? (
                          <span className="block truncate text-[10px] opacity-90">
                          {format(start, 'HH:mm')}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
