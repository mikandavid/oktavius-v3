import { startOfMonth } from 'date-fns';
import { useEffect, useState } from 'react';

import { cn } from '../../lib/utils';
import { Calendar } from '../calendar';
import { MINI_CALENDAR_CLASS_NAMES } from './calendar-mini-picker-styles';

/** In-flow nav buttons — do NOT use absolute positioning (breaks react-day-picker v9). */
const NAV_BUTTON_CLASS = cn(
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md p-0',
  'text-muted-foreground opacity-80 transition-colors',
  'hover:bg-muted hover:text-foreground hover:opacity-100',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  'disabled:pointer-events-none disabled:opacity-30',
);

/**
 * Compact month picker for sidebars and jump-to-date panels.
 *
 * Styling rules are locked here — do not re-style via raw `<Calendar>` overrides.
 * See `docs/ui-rules/calendar-components.md` → Mini month picker.
 */
export interface CalendarMiniPickerProps {
  /** Currently selected day — also drives month sync when changed externally. */
  selected: Date;
  onSelect: (date: Date) => void;
  className?: string;
}

export function CalendarMiniPicker({ selected, onSelect, className }: CalendarMiniPickerProps) {
  const [pickerMonth, setPickerMonth] = useState(() => startOfMonth(selected));
  const selectedYear = selected.getFullYear();
  const selectedMonth = selected.getMonth();

  useEffect(() => {
    setPickerMonth(startOfMonth(selected));
  }, [selected, selectedMonth, selectedYear]);

  return (
    <Calendar
      mode="single"
      weekStartsOn={1}
      month={pickerMonth}
      onMonthChange={setPickerMonth}
      selected={selected}
      onSelect={(date) => {
        if (date) onSelect(date);
      }}
      className={cn('p-0', className)}
      classNames={{
        months: 'flex w-full flex-col gap-2',
        nav: MINI_CALENDAR_CLASS_NAMES.nav,
        button_previous: NAV_BUTTON_CLASS,
        button_next: NAV_BUTTON_CLASS,
        chevron: 'h-4 w-4 fill-current',
        month: 'space-y-2',
        month_caption: 'flex justify-center py-0',
        caption_label: 'text-sm font-medium',
        month_grid: 'w-full',
        weekdays: MINI_CALENDAR_CLASS_NAMES.weekdays,
        weekday:
          'flex h-7 items-center justify-center text-[0.65rem] font-normal text-muted-foreground',
        weeks: 'flex flex-col gap-0.5',
        week: MINI_CALENDAR_CLASS_NAMES.week,
        day: 'flex items-center justify-center p-0',
        day_button: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full p-0 text-[11px] text-foreground',
          'hover:bg-muted/60',
        ),
        selected: MINI_CALENDAR_CLASS_NAMES.selected,
        outside: '[&>button]:text-muted-foreground/45',
        today: '[&>button]:font-semibold',
      }}
    />
  );
}
