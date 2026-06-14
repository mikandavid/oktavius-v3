import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../button';
import {
  type CalendarViewMode,
  formatCalendarPeriodLabel,
  schedulingToolbarClass,
  shiftCalendarAnchor,
} from './calendar-shared';
import { CalendarViewSwitcher } from './calendar-view-switcher';

export interface CalendarToolbarProps {
  anchor: Date;
  view: CalendarViewMode;
  onAnchorChange: (next: Date) => void;
  onViewChange?: (view: CalendarViewMode) => void;
  className?: string;
  /** Primary action — e.g. Create event (Google-style top-left area) */
  leadingAction?: ReactNode;
  trailing?: ReactNode;
}

export function CalendarToolbar({
  anchor,
  view,
  onAnchorChange,
  onViewChange,
  className,
  leadingAction,
  trailing,
}: CalendarToolbarProps) {
  return (
    <div className={cn(schedulingToolbarClass, className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {leadingAction}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={() => onAnchorChange(new Date())}
        >
          Today
        </Button>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Previous period"
            onClick={() => onAnchorChange(shiftCalendarAnchor(anchor, view, -1))}
          >
            <CaretLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Next period"
            onClick={() => onAnchorChange(shiftCalendarAnchor(anchor, view, 1))}
          >
            <CaretRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="truncate text-lg font-normal text-foreground">
          {formatCalendarPeriodLabel(anchor, view)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onViewChange ? <CalendarViewSwitcher view={view} onViewChange={onViewChange} /> : null}
        {trailing}
      </div>
    </div>
  );
}

export interface SchedulerToolbarProps {
  anchor: Date;
  onAnchorChange: (next: Date) => void;
  onViewChange?: (view: CalendarViewMode) => void;
  className?: string;
  leadingAction?: ReactNode;
  trailing?: ReactNode;
}

/** @deprecated Prefer CalendarToolbar inside CalendarView */
export function SchedulerToolbar(props: SchedulerToolbarProps) {
  return <CalendarToolbar {...props} view="week" />;
}
