import { useCallback, useMemo, useState } from 'react';

import {
  createCalendarEventTimesFromSlot,
  moveCalendarEvent,
  resizeCalendarEvent,
  type CalendarEvent,
  type CalendarEventMoveTarget,
  type CalendarEventResizeTarget,
  type CalendarSource,
} from '@oktavius/base-ui';

import { toast } from '@/lib/toast';

export const CALENDAR_SOURCES: CalendarSource[] = [
  { id: 'sales', label: 'Sales', color: 'violet', visible: true },
  { id: 'support', label: 'Support', color: 'teal', visible: true },
  { id: 'internal', label: 'Internal', color: 'gray', visible: true },
];

export const SAMPLE_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev_1',
    title: 'Client QBR — Apex',
    start: '2024-12-10T10:00',
    end: '2024-12-10T11:30',
    calendarId: 'sales',
    colorKey: 'violet',
  },
  {
    id: 'ev_2',
    title: 'Support standup',
    start: '2024-12-11T09:00',
    end: '2024-12-11T09:30',
    calendarId: 'support',
    colorKey: 'teal',
  },
  {
    id: 'ev_3',
    title: 'Contract renewal deadline',
    start: '2024-12-14',
    end: '2024-12-14',
    allDay: true,
    calendarId: 'sales',
    colorKey: 'orange',
  },
  {
    id: 'ev_4',
    title: 'Team planning',
    start: '2024-12-12T14:00',
    end: '2024-12-12T16:00',
    calendarId: 'internal',
    colorKey: 'gray',
  },
];

function nextEventId(): string {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useInteractiveCalendarDemo(initialEvents = SAMPLE_CALENDAR_EVENTS) {
  const [events, setEvents] = useState(initialEvents);
  const [calendars, setCalendars] = useState(CALENDAR_SOURCES);

  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        const source = calendars.find((cal) => cal.id === event.calendarId);
        return source?.visible !== false;
      }),
    [events, calendars],
  );

  const onCalendarVisibilityChange = useCallback((calendarId: string, visible: boolean) => {
    setCalendars((current) =>
      current.map((cal) => (cal.id === calendarId ? { ...cal, visible } : cal)),
    );
  }, []);

  const onEventMove = useCallback((event: CalendarEvent, target: CalendarEventMoveTarget) => {
    setEvents((current) =>
      current.map((entry) => (entry.id === event.id ? moveCalendarEvent(entry, target) : entry)),
    );
    toast.success(`Moved "${event.title}".`);
  }, []);

  const onEventResize = useCallback((event: CalendarEvent, target: CalendarEventResizeTarget) => {
    setEvents((current) =>
      current.map((entry) =>
        entry.id === event.id ? resizeCalendarEvent(entry, target, 30) : entry,
      ),
    );
    toast.success(`Updated "${event.title}".`);
  }, []);

  const addEventAtSlot = useCallback((day: Date, startTime: string, endTime?: string) => {
    const { start, end } = createCalendarEventTimesFromSlot(day, startTime, endTime, 30);
    const created: CalendarEvent = {
      id: nextEventId(),
      title: 'New event',
      start,
      end,
      calendarId: 'internal',
      colorKey: 'blue',
    };
    setEvents((current) => [...current, created]);
    toast.success('Event created — drag edges to resize or move to reschedule.');
    return created;
  }, []);

  const onSlotClick = useCallback(
    (day: Date, time: string) => {
      addEventAtSlot(day, time);
    },
    [addEventAtSlot],
  );

  const onSlotRangeSelect = useCallback(
    (day: Date, startTime: string, endTime: string) => {
      addEventAtSlot(day, startTime, endTime);
    },
    [addEventAtSlot],
  );

  return {
    events: visibleEvents,
    calendars,
    onCalendarVisibilityChange,
    onEventMove,
    onEventResize,
    onSlotClick,
    onSlotRangeSelect,
  };
}
