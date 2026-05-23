import type { CalendarColorKey, CalendarEvent, CalendarEventTone } from './calendar-shared';

export interface CalendarSource {
  id: string;
  label: string;
  color: CalendarColorKey;
  visible?: boolean;
}

export interface CalendarColorStyle {
  /** Month view pills */
  chip: string;
  /** Week/day grid blocks + agenda rows — full solid fill (Google Calendar style) */
  block: string;
  dot: string;
}

/** Google Calendar–style solid fills — full background, no side accent only */
export const CALENDAR_COLOR_STYLES: Record<CalendarColorKey, CalendarColorStyle> = {
  violet: {
    chip: 'bg-cta text-cta-foreground hover:brightness-95',
    block: 'bg-cta text-cta-foreground hover:brightness-95',
    dot: 'bg-cta',
  },
  blue: {
    chip: 'bg-info text-info-foreground hover:brightness-95',
    block: 'bg-info text-info-foreground hover:brightness-95',
    dot: 'bg-info',
  },
  teal: {
    chip: 'bg-teal-500 text-white hover:bg-teal-600',
    block: 'bg-teal-500 text-white hover:bg-teal-600',
    dot: 'bg-teal-500',
  },
  green: {
    chip: 'bg-success text-success-foreground hover:brightness-95',
    block: 'bg-success text-success-foreground hover:brightness-95',
    dot: 'bg-success',
  },
  yellow: {
    chip: 'bg-warning text-warning-foreground hover:brightness-95',
    block: 'bg-warning text-warning-foreground hover:brightness-95',
    dot: 'bg-warning',
  },
  orange: {
    chip: 'bg-orange-500 text-white hover:bg-orange-600',
    block: 'bg-orange-500 text-white hover:bg-orange-600',
    dot: 'bg-orange-500',
  },
  red: {
    chip: 'bg-destructive text-destructive-foreground hover:brightness-95',
    block: 'bg-destructive text-destructive-foreground hover:brightness-95',
    dot: 'bg-destructive',
  },
  gray: {
    chip: 'bg-muted-foreground/75 text-white hover:bg-muted-foreground/85',
    block: 'bg-muted-foreground/75 text-white hover:bg-muted-foreground/85',
    dot: 'bg-muted-foreground/75',
  },
};

const TONE_TO_COLOR: Record<CalendarEventTone, CalendarColorKey> = {
  primary: 'violet',
  default: 'gray',
  warning: 'yellow',
  success: 'green',
  destructive: 'red',
};

export function resolveEventColorKey(
  event: CalendarEvent,
  calendars?: CalendarSource[],
): CalendarColorKey {
  if (event.colorKey) return event.colorKey;
  if (event.calendarId && calendars) {
    const source = calendars.find((c) => c.id === event.calendarId);
    if (source) return source.color;
  }
  return TONE_TO_COLOR[event.tone ?? 'default'];
}

export function eventChipClasses(
  event: CalendarEvent,
  calendars?: CalendarSource[],
): string {
  return CALENDAR_COLOR_STYLES[resolveEventColorKey(event, calendars)].chip;
}

export function eventBlockClasses(
  event: CalendarEvent,
  calendars?: CalendarSource[],
): string {
  return CALENDAR_COLOR_STYLES[resolveEventColorKey(event, calendars)].block;
}

/** @deprecated Use eventBlockClasses — agenda rows use the same solid fill */
export function eventAgendaStripeClasses(
  event: CalendarEvent,
  calendars?: CalendarSource[],
): string {
  return eventBlockClasses(event, calendars);
}

export function visibleEvents(
  events: CalendarEvent[],
  calendars?: CalendarSource[],
): CalendarEvent[] {
  if (!calendars?.length) return events;
  const hidden = new Set(
    calendars.filter((c) => c.visible === false).map((c) => c.id),
  );
  if (hidden.size === 0) return events;
  return events.filter((event) => !event.calendarId || !hidden.has(event.calendarId));
}
