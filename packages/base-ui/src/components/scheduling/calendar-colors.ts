import { getSemanticToneClasses, type SemanticTone } from '../../lib/semanticPalette';
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

function calendarSolid(tone: SemanticTone): CalendarColorStyle {
  const solid = getSemanticToneClasses(tone, 'solid');
  return {
    chip: solid,
    block: solid,
    dot: getSemanticToneClasses(tone, 'dot'),
  };
}

/** Google Calendar–style solid fills — full background, no side accent only */
export const CALENDAR_COLOR_STYLES: Record<CalendarColorKey, CalendarColorStyle> = {
  violet: calendarSolid('cta'),
  blue: calendarSolid('info'),
  teal: calendarSolid('teal'),
  green: calendarSolid('success'),
  yellow: calendarSolid('warning'),
  orange: calendarSolid('orange'),
  red: calendarSolid('destructive'),
  gray: {
    chip: 'bg-neutral-500 text-neutral-50 hover:brightness-95 dark:bg-neutral-700 dark:text-neutral-950',
    block:
      'bg-neutral-500 text-neutral-50 hover:brightness-95 dark:bg-neutral-700 dark:text-neutral-950',
    dot: 'bg-neutral-500 dark:bg-neutral-700',
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

export function eventChipClasses(event: CalendarEvent, calendars?: CalendarSource[]): string {
  return CALENDAR_COLOR_STYLES[resolveEventColorKey(event, calendars)].chip;
}

export function eventBlockClasses(event: CalendarEvent, calendars?: CalendarSource[]): string {
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
  const hidden = new Set(calendars.filter((c) => c.visible === false).map((c) => c.id));
  if (hidden.size === 0) return events;
  return events.filter((event) => !event.calendarId || !hidden.has(event.calendarId));
}
