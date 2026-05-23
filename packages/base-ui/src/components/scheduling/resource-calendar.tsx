import { format } from 'date-fns';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { eventBlockClasses } from './calendar-colors';
import { CalendarToolbar } from './calendar-toolbar';
import {
  clampEventToDayWindow,
  type CalendarEvent,
  type CalendarResource,
  DEFAULT_SCHEDULER_END_HOUR,
  DEFAULT_SCHEDULER_START_HOUR,
  DEFAULT_SLOT_MINUTES,
  parseCalendarDate,
  schedulingBodyClass,
  schedulingColumnHeaderClass,
  schedulingShellClass,
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

export interface ResourceCalendarProps {
  anchor: Date;
  onAnchorChange: (next: Date) => void;
  resources: CalendarResource[];
  events?: CalendarEvent[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (resourceId: string, time: string) => void;
  className?: string;
}

export function ResourceCalendar({
  anchor,
  onAnchorChange,
  resources,
  events = [],
  startHour = DEFAULT_SCHEDULER_START_HOUR,
  endHour = DEFAULT_SCHEDULER_END_HOUR,
  slotMinutes = DEFAULT_SLOT_MINUTES,
  onEventClick,
  onSlotClick,
  className,
}: ResourceCalendarProps) {
  const slots = React.useMemo(
    () => buildTimeSlots(startHour, endHour, slotMinutes),
    [startHour, endHour, slotMinutes],
  );
  const slotHeightRem = slotMinutes >= 60 ? 3 : 2;
  const day = anchor;

  const eventsByResource = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const resource of resources) {
      map.set(
        resource.id,
        events.filter((event) => event.resourceId === resource.id && !event.allDay),
      );
    }
    return map;
  }, [events, resources]);

  return (
    <div className={cn(schedulingShellClass, className)}>
      <CalendarToolbar anchor={anchor} view="day" onAnchorChange={onAnchorChange} />
      <div className={cn(schedulingBodyClass, 'overflow-x-auto')}>
        <div
          className="grid min-w-[40rem] overflow-hidden rounded-control"
          style={{ gridTemplateColumns: `4rem repeat(${resources.length}, minmax(8rem, 1fr))` }}
        >
          <div className={cn(schedulingColumnHeaderClass, 'border-t text-left')}>
            {format(day, 'dd.MM.yyyy')}
          </div>
          {resources.map((resource) => (
            <div key={resource.id} className={cn(schedulingColumnHeaderClass, 'border-t')}>
              {resource.label}
            </div>
          ))}

          <div className="relative bg-muted/10">
            {slots.map((slot, index) =>
              index % (60 / slotMinutes) === 0 ? (
                <div
                  key={slot}
                  className={schedulingTimeLabelClass}
                  style={{ height: `${slotHeightRem * (60 / slotMinutes)}rem` }}
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

          {resources.map((resource) => {
            const resourceEvents = eventsByResource.get(resource.id) ?? [];

            return (
              <div key={resource.id} className="relative border-l border-border/40 bg-card">
                <div className="relative">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      disabled={!onSlotClick}
                      onClick={onSlotClick ? () => onSlotClick(resource.id, slot) : undefined}
                      className={cn(
                        'block w-full border-t border-border/20 transition-colors',
                        onSlotClick && 'hover:bg-muted/30',
                        !onSlotClick && 'cursor-default',
                      )}
                      style={{ height: `${slotHeightRem}rem` }}
                      aria-label={
                        onSlotClick
                          ? `Create event for ${resource.label} at ${slot}`
                          : undefined
                      }
                    />
                  ))}

                  {resourceEvents.map((event) => {
                    const layout = clampEventToDayWindow(event, day, startHour, endHour);
                    if (!layout) return null;
                    const start = parseCalendarDate(event.start);

                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={onEventClick ? () => onEventClick(event) : undefined}
                        className={cn(
                          'absolute inset-x-2 z-10 overflow-hidden rounded-control px-2 py-1 text-left text-[11px] font-medium leading-tight',
                          eventBlockClasses(event),
                        )}
                        style={{
                          top: `${layout.topPct}%`,
                          height: `${layout.heightPct}%`,
                          minHeight: '1.25rem',
                        }}
                        title={event.title}
                      >
                        <span className="block truncate font-semibold">{event.title}</span>
                        {start ? (
                          <span className="block truncate text-[10px] opacity-80">
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
    </div>
  );
}
