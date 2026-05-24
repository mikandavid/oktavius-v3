import * as React from 'react';

import { DatePicker } from './date-picker';

export interface DateRangePickerProps {
  startValue?: string;
  endValue?: string;
  onStartChange?: (value: string | null) => void;
  onEndChange?: (value: string | null) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  separator?: React.ReactNode;
  className?: string;
}

function toDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Start + end date pair. Clamps end min to start value and start max to end value.
 */
export function DateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startPlaceholder = 'Start date',
  endPlaceholder = 'End date',
  disabled,
  minDate,
  maxDate,
  separator = <span className="shrink-0 text-xs text-muted-foreground">→</span>,
}: DateRangePickerProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="min-w-[11rem] flex-1">
        <DatePicker
          mode="date"
          value={startValue}
          placeholder={startPlaceholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={toDate(endValue) ?? maxDate}
          onChange={onStartChange}
        />
      </div>
      {separator}
      <div className="min-w-[11rem] flex-1">
        <DatePicker
          mode="date"
          value={endValue}
          placeholder={endPlaceholder}
          disabled={disabled}
          minDate={toDate(startValue) ?? minDate}
          maxDate={maxDate}
          onChange={onEndChange}
        />
      </div>
    </div>
  );
}
