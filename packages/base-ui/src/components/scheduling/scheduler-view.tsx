import { cn } from '../../lib/utils';
import { type CalendarSource, visibleEvents } from './calendar-colors';
import { CalendarTimeGrid } from './calendar-time-grid';
import { CalendarToolbar } from './calendar-toolbar';
import {
  type CalendarEvent,
  DEFAULT_SCHEDULER_END_HOUR,
  DEFAULT_SCHEDULER_START_HOUR,
  DEFAULT_SLOT_MINUTES,
  getWeekDays,
  schedulingBodyClass,
  schedulingShellClass,
} from './calendar-shared';

export interface SchedulerViewProps {
  anchor: Date;
  onAnchorChange: (next: Date) => void;
  events?: CalendarEvent[];
  calendars?: CalendarSource[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (day: Date, time: string) => void;
  className?: string;
}

/** Standalone week time grid — prefer `CalendarView view="week"` for full Google-style UX */
export function SchedulerView({
  anchor,
  onAnchorChange,
  events = [],
  calendars,
  startHour = DEFAULT_SCHEDULER_START_HOUR,
  endHour = DEFAULT_SCHEDULER_END_HOUR,
  slotMinutes = DEFAULT_SLOT_MINUTES,
  onEventClick,
  onSlotClick,
  className,
}: SchedulerViewProps) {
  const filteredEvents = visibleEvents(events, calendars);

  return (
    <div className={cn(schedulingShellClass, className)}>
      <CalendarToolbar anchor={anchor} view="week" onAnchorChange={onAnchorChange} />
      <div className={cn(schedulingBodyClass, 'overflow-x-auto')}>
        <div className="min-w-[48rem]">
          <CalendarTimeGrid
            days={getWeekDays(anchor)}
            events={filteredEvents}
            calendars={calendars}
            startHour={startHour}
            endHour={endHour}
            slotMinutes={slotMinutes}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
          />
        </div>
      </div>
    </div>
  );
}
