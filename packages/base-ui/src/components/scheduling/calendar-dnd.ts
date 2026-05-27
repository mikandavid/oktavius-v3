import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { format, setHours, setMinutes, startOfDay } from 'date-fns';

import { type CalendarEvent, eventEndDate, eventStartDate } from './calendar-shared';

export const CALENDAR_EVENT_DRAG_PREFIX = 'cal-event:';
export const CALENDAR_DAY_DROP_PREFIX = 'cal-day:';
export const CALENDAR_SLOT_DROP_PREFIX = 'cal-slot:';

export function calendarEventDragId(eventId: string): string {
  return `${CALENDAR_EVENT_DRAG_PREFIX}${eventId}`;
}

export function calendarDayDropId(day: Date): string {
  return `${CALENDAR_DAY_DROP_PREFIX}${day.toISOString()}`;
}

export function calendarSlotDropId(day: Date, time: string): string {
  return `${CALENDAR_SLOT_DROP_PREFIX}${day.toISOString()}:${time}`;
}

export function parseCalendarEventDragId(id: string): string | null {
  if (!id.startsWith(CALENDAR_EVENT_DRAG_PREFIX)) return null;
  return id.slice(CALENDAR_EVENT_DRAG_PREFIX.length);
}

export function parseCalendarDayDropId(id: string): Date | null {
  if (!id.startsWith(CALENDAR_DAY_DROP_PREFIX)) return null;
  const value = id.slice(CALENDAR_DAY_DROP_PREFIX.length);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseCalendarSlotDropId(id: string): { day: Date; time: string } | null {
  if (!id.startsWith(CALENDAR_SLOT_DROP_PREFIX)) return null;
  const value = id.slice(CALENDAR_SLOT_DROP_PREFIX.length);
  const separator = value.lastIndexOf(':');
  if (separator <= 0) return null;
  const day = new Date(value.slice(0, separator));
  const time = value.slice(separator + 1);
  if (Number.isNaN(day.getTime()) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return { day, time };
}

export interface CalendarEventMoveTarget {
  day: Date;
  /** HH:mm — omitted for month / all-day moves */
  time?: string;
  /** Drop on the all-day row (converts timed events to all-day) */
  toAllDay?: boolean;
}

export interface CalendarEventResizeTarget {
  edge: 'start' | 'end';
  /** HH:mm snapped to the scheduler grid */
  time: string;
}

/** Map pointer Y within a day column to a snapped slot time (HH:mm). */
export function pointerYToSlotTime(
  clientY: number,
  columnEl: HTMLElement,
  startHour: number,
  endHour: number,
  slotMinutes: number,
): string {
  const rect = columnEl.getBoundingClientRect();
  const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
  const totalMinutes = (endHour - startHour) * 60;
  const minutesFromTop = (y / rect.height) * totalMinutes;
  const snapped = Math.round(minutesFromTop / slotMinutes) * slotMinutes;
  const clamped = Math.max(0, Math.min(snapped, totalMinutes));
  const absoluteMinutes = startHour * 60 + clamped;
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function moveCalendarEvent(
  event: CalendarEvent,
  target: CalendarEventMoveTarget,
): CalendarEvent {
  const start = eventStartDate(event);
  const end = eventEndDate(event);
  if (!start || !end) return event;

  const durationMs = Math.max(end.getTime() - start.getTime(), slotMinutesToMs(15));

  if (target.toAllDay) {
    const dayStr = format(target.day, 'yyyy-MM-dd');
    return { ...event, start: dayStr, end: dayStr, allDay: true };
  }

  if (target.time) {
    const [hours, minutes] = target.time.split(':').map(Number);
    const nextStart = setMinutes(setHours(startOfDay(target.day), hours), minutes);
    const nextEnd = event.allDay
      ? new Date(nextStart.getTime() + slotMinutesToMs(60))
      : new Date(nextStart.getTime() + durationMs);

    return {
      ...event,
      start: format(nextStart, "yyyy-MM-dd'T'HH:mm"),
      end: format(nextEnd, "yyyy-MM-dd'T'HH:mm"),
      allDay: false,
    };
  }

  if (event.allDay) {
    const dayStr = format(target.day, 'yyyy-MM-dd');
    return { ...event, start: dayStr, end: dayStr, allDay: true };
  }

  const nextStart = new Date(target.day);
  nextStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
  const nextEnd = new Date(nextStart.getTime() + durationMs);
  return {
    ...event,
    start: format(nextStart, "yyyy-MM-dd'T'HH:mm"),
    end: format(nextEnd, "yyyy-MM-dd'T'HH:mm"),
    allDay: false,
  };
}

function slotMinutesToMs(minutes: number): number {
  return minutes * 60_000;
}

export function resizeCalendarEvent(
  event: CalendarEvent,
  target: CalendarEventResizeTarget,
  slotMinutes = 15,
): CalendarEvent {
  const start = eventStartDate(event);
  const end = eventEndDate(event);
  if (!start || !end || event.allDay) return event;

  const minDurationMs = slotMinutesToMs(slotMinutes);
  const [hours, minutes] = target.time.split(':').map(Number);
  const day = target.edge === 'start' ? start : end;
  const nextEdge = setMinutes(setHours(startOfDay(day), hours), minutes);

  if (target.edge === 'start') {
    if (nextEdge.getTime() >= end.getTime() - minDurationMs + 1) return event;
    return {
      ...event,
      start: format(nextEdge, "yyyy-MM-dd'T'HH:mm"),
    };
  }

  if (nextEdge.getTime() <= start.getTime() + minDurationMs - 1) return event;
  return {
    ...event,
    end: format(nextEdge, "yyyy-MM-dd'T'HH:mm"),
  };
}

export function useCalendarDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export interface CalendarDayColumnRef {
  day: Date;
  el: HTMLElement;
}

/** Find the day column element under the pointer (week/day grid). */
export function findColumnAtPointer(
  clientX: number,
  clientY: number,
  columns: CalendarDayColumnRef[],
): CalendarDayColumnRef | null {
  for (const column of columns) {
    const rect = column.el.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return column;
    }
  }
  return null;
}

/** Resolve a drag drop target from pointer position within the time grid. */
export function pointerToMoveTarget(
  clientX: number,
  clientY: number,
  columns: CalendarDayColumnRef[],
  startHour: number,
  endHour: number,
  snapMinutes: number,
): CalendarEventMoveTarget | null {
  const column = findColumnAtPointer(clientX, clientY, columns);
  if (!column) return null;
  const time = pointerYToSlotTime(clientY, column.el, startHour, endHour, snapMinutes);
  return { day: column.day, time };
}

export interface CalendarAllDayColumnRef {
  day: Date;
  el: HTMLElement;
}

/** Resolve drop target from pointer — checks all-day row first, then timed columns. */
export function pointerToDropTarget(
  clientX: number,
  clientY: number,
  allDayColumns: CalendarAllDayColumnRef[],
  timeColumns: CalendarDayColumnRef[],
  startHour: number,
  endHour: number,
  snapMinutes: number,
  sourceIsAllDay: boolean,
  grabOffsetY: number,
): CalendarEventMoveTarget | null {
  for (const column of allDayColumns) {
    const rect = column.el.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return { day: column.day, toAllDay: true };
    }
  }

  const timeColumn = findColumnAtPointer(clientX, clientY, timeColumns);
  if (!timeColumn) return null;

  const anchorY = sourceIsAllDay ? clientY : clientY - grabOffsetY;
  const time = pointerYToSlotTime(anchorY, timeColumn.el, startHour, endHour, snapMinutes);
  return { day: timeColumn.day, time };
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Ensure start < end with at least one slot of duration. */
export function normalizeSlotRange(
  startTime: string,
  endTime: string,
  slotMinutes: number,
): { start: string; end: string } {
  let startMin = timeStringToMinutes(startTime);
  let endMin = timeStringToMinutes(endTime);
  if (startMin === endMin) endMin += slotMinutes;
  if (startMin > endMin) [startMin, endMin] = [endMin, startMin];
  return { start: minutesToTimeString(startMin), end: minutesToTimeString(endMin) };
}

/** Percent layout for a HH:mm range inside the day window. */
export function slotRangeLayout(
  startTime: string,
  endTime: string,
  startHour: number,
  endHour: number,
): { topPct: number; heightPct: number } {
  const totalMinutes = (endHour - startHour) * 60;
  const { start, end } = normalizeSlotRange(startTime, endTime, 15);
  const topMinutes = Math.max(0, timeStringToMinutes(start) - startHour * 60);
  const bottomMinutes = Math.min(totalMinutes, timeStringToMinutes(end) - startHour * 60);
  const heightMinutes = Math.max(15, bottomMinutes - topMinutes);
  return {
    topPct: (topMinutes / totalMinutes) * 100,
    heightPct: (heightMinutes / totalMinutes) * 100,
  };
}

export function createCalendarEventTimesFromSlot(
  day: Date,
  startTime: string,
  endTime?: string,
  slotMinutes = 30,
): { start: string; end: string } {
  const { start, end } = endTime
    ? normalizeSlotRange(startTime, endTime, slotMinutes)
    : { start: startTime, end: minutesToTimeString(timeStringToMinutes(startTime) + slotMinutes) };
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  const nextStart = setMinutes(setHours(startOfDay(day), startHours), startMinutes);
  const nextEnd = setMinutes(setHours(startOfDay(day), endHours), endMinutes);
  return {
    start: format(nextStart, "yyyy-MM-dd'T'HH:mm"),
    end: format(nextEnd, "yyyy-MM-dd'T'HH:mm"),
  };
}
