import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { getSemanticToneClasses } from '../../lib/semanticPalette';
import { cn } from '../../lib/utils';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

export const CALENDAR_VIEW_OPTIONS: Array<{ id: CalendarViewMode; label: string }> = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'agenda', label: 'Schedule' },
];

export type CalendarColorKey =
  | 'violet'
  | 'blue'
  | 'teal'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'gray';

export type CalendarEventTone = 'default' | 'primary' | 'warning' | 'success' | 'destructive';

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date `YYYY-MM-DD` or datetime `YYYY-MM-DDTHH:mm` */
  start: string;
  /** ISO date or datetime — inclusive end for all-day spans */
  end: string;
  allDay?: boolean;
  /** @deprecated Prefer colorKey + calendarId */
  tone?: CalendarEventTone;
  /** Google-style calendar color */
  colorKey?: CalendarColorKey;
  /** Links event to a CalendarSource for color + visibility */
  calendarId?: string;
  /** Resource column id for `ResourceCalendar` */
  resourceId?: string;
}

export interface CalendarResource {
  id: string;
  label: string;
}

export interface CalendarSlotAnchor {
  x: number;
  y: number;
}

export interface CalendarEventEditorDraft {
  day: Date;
  startTime: string;
  endTime: string;
  anchor: CalendarSlotAnchor;
  /** When set, the editor updates an existing event instead of creating one. */
  eventId?: string;
  allDay?: boolean;
  title?: string;
  calendarId?: string;
}

/** @deprecated Use CalendarEventEditorDraft */
export type CalendarCreateDraft = CalendarEventEditorDraft;

export type CalendarEventClickHandler = (event: CalendarEvent, anchor: CalendarSlotAnchor) => void;

export function eventClickAnchor(element: HTMLElement): CalendarSlotAnchor {
  const rect = element.getBoundingClientRect();
  return { x: rect.right, y: rect.top };
}

export const CALENDAR_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const DEFAULT_SCHEDULER_START_HOUR = 7;
export const DEFAULT_SCHEDULER_END_HOUR = 20;
/** Visual grid row height (30 min matches Google Calendar's default slot labels). */
export const DEFAULT_SLOT_MINUTES = 30;
/** Drag, resize, and create snap increment (Google uses 15 min). */
export const CALENDAR_SNAP_MINUTES = 15;

export function parseCalendarDate(value: string): Date | null {
  if (!value) return null;
  const date = parseISO(value.length <= 10 ? `${value}T00:00:00` : value);
  return isValid(date) ? date : null;
}

export function eventStartDate(event: CalendarEvent): Date | null {
  return parseCalendarDate(event.start);
}

export function eventEndDate(event: CalendarEvent): Date | null {
  return parseCalendarDate(event.end);
}

export function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const start = eventStartDate(event);
  const end = eventEndDate(event);
  if (!start || !end) return false;

  const dayStart = startOfDay(day);
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);

  return dayStart >= rangeStart && dayStart <= rangeEnd;
}

export function sortEventsByStart(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aStart = eventStartDate(a)?.getTime() ?? 0;
    const bStart = eventStartDate(b)?.getTime() ?? 0;
    return aStart - bStart;
  });
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return sortEventsByStart(events.filter((event) => eventOccursOnDay(event, day)));
}

export function getMonthGridDays(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getWeekDays(anchor: Date): Date[] {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
}

export function formatCalendarPeriodLabel(anchor: Date, mode: CalendarViewMode): string {
  switch (mode) {
    case 'month':
      return format(anchor, 'MMMM yyyy');
    case 'week': {
      const days = getWeekDays(anchor);
      const first = days[0];
      const last = days[6];
      if (isSameMonth(first, last)) {
        return `${format(first, 'd')} – ${format(last, 'd MMMM yyyy')}`;
      }
      return `${format(first, 'd MMM')} – ${format(last, 'd MMM yyyy')}`;
    }
    case 'day':
      return format(anchor, 'EEEE, d MMMM yyyy');
    case 'agenda':
      return format(anchor, 'MMMM yyyy');
  }
}

export function shiftCalendarAnchor(anchor: Date, mode: CalendarViewMode, direction: -1 | 1): Date {
  switch (mode) {
    case 'month':
      return addMonths(anchor, direction);
    case 'week':
      return addWeeks(anchor, direction);
    case 'day':
      return addDays(anchor, direction);
    case 'agenda':
      return addMonths(anchor, direction);
  }
}

export function formatEventTimeRange(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  const start = eventStartDate(event);
  const end = eventEndDate(event);
  if (!start || !end) return '—';
  return `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`;
}

export function formatAgendaDayHeading(day: Date): string {
  return format(day, 'EEEE, dd.MM.yyyy');
}

export function groupEventsByDay(
  events: CalendarEvent[],
): Array<{ day: Date; events: CalendarEvent[] }> {
  const sorted = sortEventsByStart(events);
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of sorted) {
    const start = eventStartDate(event);
    if (!start) continue;
    const key = format(startOfDay(start), 'yyyy-MM-dd');
    const bucket = groups.get(key) ?? [];
    bucket.push(event);
    groups.set(key, bucket);
  }

  return [...groups.entries()].map(([key, dayEvents]) => ({
    day: parseISO(`${key}T00:00:00`),
    events: dayEvents,
  }));
}

export function eventToneClass(tone: CalendarEventTone = 'default'): string {
  switch (tone) {
    case 'primary':
      return cn(getSemanticToneClasses('cta', 'soft'), 'text-cta hover:bg-cta/20');
    case 'warning':
      return cn(getSemanticToneClasses('warning', 'soft'), 'text-warning hover:bg-warning/20');
    case 'success':
      return cn(getSemanticToneClasses('success', 'soft'), 'text-success hover:bg-success/20');
    case 'destructive':
      return cn(
        getSemanticToneClasses('destructive', 'soft'),
        'text-destructive hover:bg-destructive/20',
      );
    default:
      return cn(getSemanticToneClasses('neutral', 'solid'), 'hover:bg-muted/80');
  }
}

export function clampEventToDayWindow(
  event: CalendarEvent,
  day: Date,
  startHour: number,
  endHour: number,
): { topPct: number; heightPct: number } | null {
  if (event.allDay) return null;
  if (!eventOccursOnDay(event, day)) return null;

  const start = eventStartDate(event);
  const end = eventEndDate(event);
  if (!start || !end) return null;

  const windowStart = new Date(day);
  windowStart.setHours(startHour, 0, 0, 0);
  const windowEnd = new Date(day);
  windowEnd.setHours(endHour, 0, 0, 0);

  const effectiveStart = new Date(Math.max(start.getTime(), windowStart.getTime()));
  const effectiveEnd = new Date(Math.min(end.getTime(), windowEnd.getTime()));
  if (effectiveEnd <= effectiveStart) return null;

  const totalMinutes = (endHour - startHour) * 60;
  const topMinutes = (effectiveStart.getHours() - startHour) * 60 + effectiveStart.getMinutes();
  const durationMinutes = Math.max(
    15,
    (effectiveEnd.getTime() - effectiveStart.getTime()) / 60_000,
  );

  return {
    topPct: (topMinutes / totalMinutes) * 100,
    heightPct: (durationMinutes / totalMinutes) * 100,
  };
}

export function isToday(day: Date): boolean {
  return isSameDay(day, new Date());
}

export function isOutsideMonth(day: Date, anchor: Date): boolean {
  return !isSameMonth(day, anchor);
}

export function eventToEditorDraft(
  event: CalendarEvent,
  anchor: CalendarSlotAnchor,
): CalendarEventEditorDraft {
  const start = eventStartDate(event);
  const end = eventEndDate(event);
  const day = startOfDay(start ?? new Date());

  return {
    day,
    startTime: start && !event.allDay ? format(start, 'HH:mm') : '09:00',
    endTime: end && !event.allDay ? format(end, 'HH:mm') : '10:00',
    anchor,
    eventId: event.id,
    allDay: event.allDay,
    title: event.title,
    calendarId: event.calendarId,
  };
}

/** Borderless white tile shell */
export const schedulingShellClass = 'overflow-hidden rounded-card bg-card';

/** Toolbar — separated from body with bottom border + comfortable inset */
export const schedulingToolbarClass =
  'flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-3';

/** Standard body inset — keeps text and controls off the card edge */
export const schedulingBodyClass = 'px-4 pb-4 pt-3';

/** Time-axis label cell in scheduler grids */
export const schedulingTimeLabelClass =
  'border-t border-border/30 pl-3 pr-2 py-1.5 text-[10px] tabular-nums text-muted-foreground';

/** Column / day header in scheduler grids */
export const schedulingColumnHeaderClass =
  'border-l border-border/40 bg-muted/20 px-3 py-3 text-center';
