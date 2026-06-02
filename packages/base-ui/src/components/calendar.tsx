import { DayPicker } from 'react-day-picker';
import * as React from 'react';

import { cn } from '../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Default month grid for popovers and forms (`DatePicker`).
 * For sidebar jump-to-date panels use `<CalendarMiniPicker>` — it ships correct
 * react-day-picker v9 grid + nav styling; do not override this component ad hoc.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        button_previous: cn(
          'absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'inline-flex items-center justify-center rounded-md text-sm font-medium',
          'ring-offset-background transition-colors',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        ),
        button_next: cn(
          'absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'inline-flex items-center justify-center rounded-md text-sm font-medium',
          'ring-offset-background transition-colors',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: cn(
          'h-9 w-9 p-0 font-normal',
          'inline-flex items-center justify-center rounded-md text-sm',
          'ring-offset-background transition-colors',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'aria-selected:opacity-100',
        ),
        range_end: 'day-range-end',
        selected:
          '[&>button]:bg-cta [&>button]:text-cta-foreground [&>button]:hover:bg-cta [&>button]:hover:text-cta-foreground [&>button]:focus:bg-cta [&>button]:focus:text-cta-foreground',
        today: '[&>button]:bg-muted [&>button]:text-foreground',
        outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-muted/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'aria-selected:bg-muted aria-selected:text-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';
