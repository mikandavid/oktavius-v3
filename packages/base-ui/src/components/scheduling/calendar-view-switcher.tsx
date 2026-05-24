import { cn } from '../../lib/utils';
import { CALENDAR_VIEW_OPTIONS, type CalendarViewMode } from './calendar-shared';

export interface CalendarViewSwitcherProps {
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  className?: string;
}

/** Google Calendar–style Day / Week / Month / Schedule segmented control */
export function CalendarViewSwitcher({ view, onViewChange, className }: CalendarViewSwitcherProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-control border border-border/60 bg-muted/40 p-0.5',
        className,
      )}
      role="tablist"
      aria-label="Calendar view"
    >
      {CALENDAR_VIEW_OPTIONS.map((option) => {
        const active = view === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onViewChange(option.id)}
            className={cn(
              'rounded-control px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
