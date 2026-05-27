import { useCallback, useMemo, useState } from 'react';

import {
  createCalendarEventTimesFromSlot,
  eventToEditorDraft,
  moveCalendarEvent,
  normalizeSlotRange,
  resizeCalendarEvent,
  type CalendarEvent,
  type CalendarEventEditorDraft,
  type CalendarEventMoveTarget,
  type CalendarEventResizeTarget,
  type CalendarSlotAnchor,
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
    start: `${new Date().toISOString().slice(0, 10)}T10:00`,
    end: `${new Date().toISOString().slice(0, 10)}T11:30`,
    calendarId: 'sales',
    colorKey: 'violet',
  },
  {
    id: 'ev_2',
    title: 'Support standup',
    start: `${new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}T09:00`,
    end: `${new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}T09:30`,
    calendarId: 'support',
    colorKey: 'teal',
  },
  {
    id: 'ev_3',
    title: 'Contract renewal deadline',
    start: `${new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10)}`,
    end: `${new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10)}`,
    allDay: true,
    calendarId: 'sales',
    colorKey: 'orange',
  },
  {
    id: 'ev_4',
    title: 'Team planning',
    start: `${new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10)}T14:00`,
    end: `${new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10)}T16:00`,
    calendarId: 'internal',
    colorKey: 'gray',
  },
  {
    id: 'ev_5',
    title: 'Sales sync',
    start: `${new Date().toISOString().slice(0, 10)}T10:30`,
    end: `${new Date().toISOString().slice(0, 10)}T11:00`,
    calendarId: 'sales',
    colorKey: 'blue',
  },
];

export function useInteractiveCalendarDemo(initialEvents = SAMPLE_CALENDAR_EVENTS) {
  const [events, setEvents] = useState(initialEvents);
  const [calendars, setCalendars] = useState(CALENDAR_SOURCES);
  const [editorDraft, setEditorDraft] = useState<CalendarEventEditorDraft | null>(null);

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
    if (target.toAllDay) {
      toast.success(`Moved "${event.title}" to all day.`);
      return;
    }
    if (event.allDay && target.time) {
      toast.success(`Moved "${event.title}" to ${target.time}.`);
      return;
    }
    toast.success(`Moved "${event.title}".`);
  }, []);

  const onEventResize = useCallback((event: CalendarEvent, target: CalendarEventResizeTarget) => {
    setEvents((current) =>
      current.map((entry) =>
        entry.id === event.id ? resizeCalendarEvent(entry, target, 15) : entry,
      ),
    );
    toast.success(`Updated "${event.title}".`);
  }, []);

  const openCreateDraft = useCallback(
    (day: Date, startTime: string, endTime: string | undefined, anchor: CalendarSlotAnchor) => {
      const range = endTime ? normalizeSlotRange(startTime, endTime, 15) : null;
      const { start, end } = createCalendarEventTimesFromSlot(
        day,
        range?.start ?? startTime,
        range?.end,
        range ? 15 : 30,
      );

      setEditorDraft({
        day,
        startTime: start.slice(11, 16),
        endTime: end.slice(11, 16),
        anchor,
      });
    },
    [],
  );

  const onSlotClick = useCallback(
    (day: Date, time: string, anchor: CalendarSlotAnchor) => {
      openCreateDraft(day, time, undefined, anchor);
    },
    [openCreateDraft],
  );

  const onSlotRangeSelect = useCallback(
    (day: Date, startTime: string, endTime: string, anchor: CalendarSlotAnchor) => {
      openCreateDraft(day, startTime, endTime, anchor);
    },
    [openCreateDraft],
  );

  const onEventClick = useCallback((event: CalendarEvent, anchor: CalendarSlotAnchor) => {
    setEditorDraft(eventToEditorDraft(event, anchor));
  }, []);

  const confirmSave = useCallback((event: CalendarEvent) => {
    setEvents((current) => {
      const exists = current.some((entry) => entry.id === event.id);
      if (exists) {
        return current.map((entry) => (entry.id === event.id ? event : entry));
      }
      return [...current, event];
    });
    setEditorDraft(null);
    toast.success(`Saved "${event.title}".`);
  }, []);

  const cancelEditor = useCallback(() => {
    setEditorDraft(null);
  }, []);

  return {
    events: visibleEvents,
    calendars,
    editorDraft,
    onCalendarVisibilityChange,
    onEventMove,
    onEventResize,
    onEventClick,
    onSlotClick,
    onSlotRangeSelect,
    confirmSave,
    cancelEditor,
  };
}
