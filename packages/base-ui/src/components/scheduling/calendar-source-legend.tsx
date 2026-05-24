import { cn } from '../../lib/utils';
import { type CalendarSource, CALENDAR_COLOR_STYLES } from './calendar-colors';

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
          <label
            key={calendar.id}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
              !visible && 'opacity-50',
            )}
          >
            <input
              type="checkbox"
              checked={visible}
              disabled={!onToggle}
              onChange={onToggle ? (e) => onToggle(calendar.id, e.target.checked) : undefined}
              className="h-3.5 w-3.5 rounded border-border/70 accent-cta"
            />
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotClass)} aria-hidden />
            <span className="truncate text-foreground">{calendar.label}</span>
          </label>
        );
      })}
    </div>
  );
}
