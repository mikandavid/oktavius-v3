import { cn } from '../../lib/utils';
import { type CalendarSource, CALENDAR_COLOR_STYLES } from './calendar-colors';
import { CalendarSidebarToggleRow } from './calendar-sidebar-primitives';

export interface CalendarSourceLegendProps {
  calendars: CalendarSource[];
  onToggle?: (calendarId: string, visible: boolean) => void;
  className?: string;
}

/** Optional sidebar legend — calendar visibility toggles with color dots */
export function CalendarSourceLegend({
  calendars,
  onToggle,
  className,
}: CalendarSourceLegendProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {calendars.map((calendar) => {
        const visible = calendar.visible !== false;
        const dotClass = CALENDAR_COLOR_STYLES[calendar.color].dot;

        return (
          <CalendarSidebarToggleRow
            key={calendar.id}
            checked={visible}
            onCheckedChange={onToggle ? (checked) => onToggle(calendar.id, checked) : undefined}
            leading={
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotClass)} aria-hidden />
            }
            label={calendar.label}
          />
        );
      })}
    </div>
  );
}
