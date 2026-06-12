/**
 * DatePicker — flexible date / time / datetime picker.
 *
 * mode="date"     → calendar only, value is ISO date string "YYYY-MM-DD"
 * mode="time"     → time spinner only, value is "HH:mm"
 * mode="datetime" → calendar + time spinner, value is ISO datetime "YYYY-MM-DDTHH:mm"
 *                   Datetime trigger is two sectioned inputs: [DD.MM.YYYY] | [HH:mm]
 *
 * Display format is always DD.MM.YYYY. Internal value stays ISO for form compatibility.
 */

import { CalendarBlank, Clock, X } from '@phosphor-icons/react';
import { format, isValid, parse, parseISO } from 'date-fns';
import * as React from 'react';

import { cn } from '../lib/utils';
import { Calendar } from './calendar';
import { Popover, PopoverAnchor, PopoverContent } from './popover';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DatePickerMode = 'date' | 'time' | 'datetime';

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string | null) => void;
  mode?: DatePickerMode;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  minuteStep?: number;
  className?: string;
  id?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseValue(value: string | undefined, mode: DatePickerMode): Date | null {
  if (!value) return null;
  try {
    if (mode === 'time') {
      const d = parse(value, 'HH:mm', new Date());
      return isValid(d) ? d : null;
    }
    if (mode === 'date') {
      const d = parse(value, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : null;
    }
    const d = parseISO(value);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

function toOutputString(date: Date, mode: DatePickerMode): string {
  if (mode === 'date') return format(date, 'yyyy-MM-dd');
  if (mode === 'time') return format(date, 'HH:mm');
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function clampMinutes(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}

/** Parse a user-typed date string. Accepts DD.MM.YYYY and common alternatives. */
function tryParseDate(text: string): Date | null {
  const t = text.trim();
  if (!t) return null;
  for (const fmt of [
    'dd.MM.yyyy',
    'd.M.yyyy',
    'd.MM.yyyy',
    'dd.M.yyyy',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'M/d/yyyy',
    'yyyy-MM-dd',
  ]) {
    try {
      const d = parse(t, fmt, new Date());
      if (isValid(d)) return d;
    } catch {
      /* */
    }
  }
  return null;
}

/** Parse a user-typed time string. */
function tryParseTime(text: string): { h: number; m: number } | null {
  const t = text.trim();
  if (!t) return null;
  for (const fmt of ['HH:mm', 'H:mm', 'H:m']) {
    try {
      const d = parse(t, fmt, new Date());
      if (isValid(d)) return { h: d.getHours(), m: d.getMinutes() };
    } catch {
      /* */
    }
  }
  return null;
}

// ─── Time Spinner ─────────────────────────────────────────────────────────────

interface TimeSpinnerProps {
  hours: number;
  minutes: number;
  minuteStep: number;
  onHoursChange: (h: number) => void;
  onMinutesChange: (m: number) => void;
}

function TimeSpinner({
  hours,
  minutes,
  minuteStep,
  onHoursChange,
  onMinutesChange,
}: TimeSpinnerProps) {
  const pad = (n: number) => String(n).padStart(2, '0');

  const adjustHours = (delta: number) => onHoursChange((hours + delta + 24) % 24);
  const adjustMinutes = (delta: number) => {
    const next = clampMinutes(minutes + delta * minuteStep, minuteStep);
    if (next < 0) {
      onMinutesChange(60 - minuteStep);
      adjustHours(-1);
    } else if (next >= 60) {
      onMinutesChange(0);
      adjustHours(1);
    } else onMinutesChange(next);
  };

  const spinBtn =
    'flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-bold select-none';

  return (
    <div className="flex items-center gap-1 px-3 pb-3 pt-1">
      <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          className={spinBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => adjustHours(1)}
        >
          ▲
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={pad(hours)}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 0 && n < 24) onHoursChange(n);
          }}
          className="w-8 rounded-sm bg-muted/60 px-1 py-0.5 text-center text-sm font-medium transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="button"
          className={spinBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => adjustHours(-1)}
        >
          ▼
        </button>
      </div>
      <span className="text-sm font-medium text-muted-foreground">:</span>
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          className={spinBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => adjustMinutes(1)}
        >
          ▲
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={pad(minutes)}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 0 && n < 60) onMinutesChange(clampMinutes(n, minuteStep));
          }}
          className="w-8 rounded-sm bg-muted/60 px-1 py-0.5 text-center text-sm font-medium transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="button"
          className={spinBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => adjustMinutes(-1)}
        >
          ▼
        </button>
      </div>
    </div>
  );
}

// ─── DatePicker ───────────────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  mode = 'date',
  placeholder,
  disabled = false,
  minDate,
  maxDate,
  minuteStep = 1,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const timeInputRef = React.useRef<HTMLInputElement>(null);

  const parsedDate = parseValue(value, mode);

  const formatDate = (d: Date | null) => (d ? format(d, 'dd.MM.yyyy') : '');
  const formatTime = (d: Date | null) =>
    d
      ? `${String(d.getHours()).padStart(2, '0')}:${String(clampMinutes(d.getMinutes(), minuteStep)).padStart(2, '0')}`
      : '';

  const [dateText, setDateText] = React.useState(() => formatDate(parsedDate));
  const [timeText, setTimeText] = React.useState(() => formatTime(parsedDate));
  const [hours, setHours] = React.useState(parsedDate?.getHours() ?? 0);
  const [minutes, setMinutes] = React.useState(
    clampMinutes(parsedDate?.getMinutes() ?? 0, minuteStep),
  );
  const [dateInvalid, setDateInvalid] = React.useState(false);

  // Sync display from external value
  React.useEffect(() => {
    const d = parseValue(value, mode);
    setDateText(formatDate(d));
    setDateInvalid(false);
    setTimeText(formatTime(d));
    if (d) {
      setHours(d.getHours());
      setMinutes(clampMinutes(d.getMinutes(), minuteStep));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode, minuteStep]);

  const emitDate = React.useCallback(
    (date: Date | null, h?: number, m?: number) => {
      if (!onChange) return;
      if (!date) {
        onChange(null);
        return;
      }
      const out = new Date(date);
      if (mode !== 'date') out.setHours(h ?? hours, m ?? minutes, 0, 0);
      onChange(toOutputString(out, mode));
    },
    [onChange, mode, hours, minutes],
  );

  // ── Date input handlers ──────────────────────────────────────────────────

  const handleDateChange = (raw: string) => {
    // Strip anything that isn't a digit or dot
    const stripped = raw.replace(/[^\d.]/g, '');

    // Extract only the digit characters for masking logic
    const digits = stripped.replace(/\./g, '');

    let masked = '';
    if (digits.length <= 2) {
      masked = digits;
    } else if (digits.length <= 4) {
      masked = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    } else {
      masked = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
    }

    // Clamp to DD.MM.YYYY max length (10 chars)
    if (masked.length > 10) return;

    setDateInvalid(false);
    setDateText(masked);

    // Only emit if we have a complete DD.MM.YYYY
    if (masked.length === 10) {
      const parsed = tryParseDate(masked);
      if (parsed) emitDate(parsed);
    } else if (!masked) {
      onChange?.(null);
    }
  };

  const handleDateBlur = () => {
    if (!dateText.trim()) {
      setDateInvalid(false);
      return;
    }
    const parsed = tryParseDate(dateText);
    if (parsed) {
      setDateInvalid(false);
      setDateText(formatDate(parsed));
      emitDate(parsed);
    } else {
      // Revert to last valid value and show error
      const prev = parseValue(value, mode);
      if (prev) {
        setDateInvalid(false);
        setDateText(formatDate(prev));
      } else {
        setDateInvalid(true);
      }
    }
  };

  // ── Time input handlers ──────────────────────────────────────────────────

  const handleTimeChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');

    let masked = '';
    if (digits.length <= 2) {
      masked = digits;
    } else {
      masked = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }

    if (masked.length > 5) return;

    setTimeText(masked);

    if (masked.length === 5) {
      const parsed = tryParseTime(masked);
      if (parsed) {
        setHours(parsed.h);
        setMinutes(parsed.m);
        const baseDate = parseValue(value, mode) ?? new Date();
        emitDate(baseDate, parsed.h, parsed.m);
      }
    }
  };

  const handleTimeBlur = () => {
    const parsed = tryParseTime(timeText);
    if (parsed) {
      setTimeText(`${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`);
    } else {
      setTimeText(formatTime(parseValue(value, mode)));
    }
  };

  // ── Calendar handlers ────────────────────────────────────────────────────

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    emitDate(day);
    if (mode === 'date') setOpen(false);
    else timeInputRef.current?.focus();
  };

  const handleHoursChange = (h: number) => {
    setHours(h);
    if (parsedDate) emitDate(parsedDate, h, minutes);
  };

  const handleMinutesChange = (m: number) => {
    setMinutes(m);
    if (parsedDate) emitDate(parsedDate, hours, m);
  };

  const handleClear = () => {
    onChange?.(null);
    setDateText('');
    setTimeText('');
    setOpen(false);
  };

  const sharedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      (e.target as HTMLElement).blur();
    }
    if (e.key === 'Enter') setOpen(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const hasClear = parsedDate && onChange && !disabled;
  const inputBase = cn(
    'bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
  );

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverAnchor asChild>
        {mode === 'datetime' ? (
          // ── Sectioned datetime trigger ──────────────────────────────────
          <div
            className={cn(
              'flex h-9 w-full min-w-0 items-center rounded-control bg-muted/60 hover:bg-muted/80',
              dateInvalid
                ? 'ring-2 ring-destructive'
                : 'focus-within:ring-2 focus-within:ring-ring/40',
              'transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
          >
            <div className="flex min-w-0 items-center">
              <span className="flex shrink-0 items-center pl-3 text-muted-foreground">
                <CalendarBlank className="h-3.5 w-3.5" />
              </span>
              <input
                ref={dateInputRef}
                id={id}
                type="text"
                disabled={disabled}
                value={dateText}
                placeholder="DD.MM.YYYY"
                onFocus={() => !disabled && setOpen(true)}
                onChange={(e) => handleDateChange(e.target.value)}
                onBlur={handleDateBlur}
                onKeyDown={sharedKeyDown}
                className={cn(inputBase, 'w-[6.5rem] shrink-0 px-2')}
              />
              <span className="select-none px-1 text-xs text-border">|</span>
              <span className="flex shrink-0 items-center text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <input
                ref={timeInputRef}
                type="text"
                disabled={disabled}
                value={timeText}
                placeholder="HH:mm"
                onFocus={() => !disabled && setOpen(true)}
                onChange={(e) => handleTimeChange(e.target.value)}
                onBlur={handleTimeBlur}
                onKeyDown={sharedKeyDown}
                className={cn(inputBase, 'w-14 shrink-0 px-2')}
              />
            </div>
            {hasClear ? (
              <button
                type="button"
                aria-label="Clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="ml-auto mr-2 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ) : (
          // ── Single input trigger (date or time) ─────────────────────────
          <div className={cn('relative', className)}>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {mode === 'time' ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <CalendarBlank className="h-3.5 w-3.5" />
              )}
            </span>
            <input
              ref={dateInputRef}
              id={id}
              type="text"
              disabled={disabled}
              value={mode === 'time' ? timeText : dateText}
              placeholder={placeholder ?? (mode === 'time' ? 'HH:mm' : 'DD.MM.YYYY')}
              onFocus={() => !disabled && setOpen(true)}
              onChange={(e) =>
                mode === 'time'
                  ? handleTimeChange(e.target.value)
                  : handleDateChange(e.target.value)
              }
              onBlur={mode === 'time' ? handleTimeBlur : handleDateBlur}
              onKeyDown={sharedKeyDown}
              className={cn(
                'flex h-9 w-full rounded-control bg-muted/60 hover:bg-muted/80 py-1 pl-8 text-sm',
                'transition-colors placeholder:text-muted-foreground',
                'focus-visible:outline-none',
                mode === 'date' && dateInvalid
                  ? 'ring-2 ring-destructive'
                  : 'focus-visible:ring-2 focus-visible:ring-ring/40',
                'disabled:cursor-not-allowed disabled:opacity-50',
                hasClear ? 'pr-7' : 'pr-3',
              )}
            />
            {hasClear ? (
              <button
                type="button"
                aria-label="Clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        )}
      </PopoverAnchor>

      <PopoverContent className="w-auto p-0" align="start">
        {mode === 'time' ? (
          <TimeSpinner
            hours={hours}
            minutes={minutes}
            minuteStep={minuteStep}
            onHoursChange={handleHoursChange}
            onMinutesChange={handleMinutesChange}
          />
        ) : (
          <div>
            <div className={mode === 'datetime' ? 'flex' : undefined}>
              <Calendar
                mode="single"
                selected={parsedDate ?? undefined}
                onSelect={handleDaySelect}
                disabled={(day) => {
                  if (minDate && day < minDate) return true;
                  if (maxDate && day > maxDate) return true;
                  return false;
                }}
                defaultMonth={parsedDate ?? undefined}
              />
              {mode === 'datetime' ? (
                <div className="flex items-center justify-center border-l border-border px-2">
                  <TimeSpinner
                    hours={hours}
                    minutes={minutes}
                    minuteStep={minuteStep}
                    onHoursChange={handleHoursChange}
                    onMinutesChange={handleMinutesChange}
                  />
                </div>
              ) : null}
            </div>
            <div className="flex justify-between border-t border-border px-3 py-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const now = new Date();
                  if (mode === 'datetime') {
                    const h = now.getHours();
                    const m = clampMinutes(now.getMinutes(), minuteStep);
                    setHours(h);
                    setMinutes(m);
                    emitDate(now, h, m);
                  } else {
                    emitDate(now);
                    setOpen(false);
                  }
                }}
                className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Today
              </button>
              {mode === 'datetime' ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Done
                </button>
              ) : null}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
