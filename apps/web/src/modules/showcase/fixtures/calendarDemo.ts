import type { CalendarEvent, CalendarSource } from '@oktavius/base-ui';

import { useCalendarRuntime } from '@/modules/calendar/shared';

export const SHOWCASE_CALENDAR_SOURCES: CalendarSource[] = [
  { id: 'sales', label: 'Sales', color: 'violet', visible: true },
  { id: 'support', label: 'Support', color: 'teal', visible: true },
  { id: 'internal', label: 'Internal', color: 'gray', visible: true },
];

export const SHOWCASE_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev_1',
    title: 'Client QBR - Apex',
    start: `${new Date().toISOString().slice(0, 10)}T10:00`,
    end: `${new Date().toISOString().slice(0, 10)}T11:30`,
    calendarId: 'sales',
    colorKey: 'violet',
    description: 'Quarterly review with Apex leadership. Bring pipeline deck.',
    attendeeIds: ['usr_1001', 'usr_1002'],
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
    id: 'ev_6',
    title: 'Team offsite',
    start: (() => {
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      return monday.toISOString().slice(0, 10);
    })(),
    end: (() => {
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const tuesday = new Date(monday);
      tuesday.setDate(tuesday.getDate() + 1);
      return tuesday.toISOString().slice(0, 10);
    })(),
    allDay: true,
    calendarId: 'internal',
    colorKey: 'green',
    description: 'Two-day planning offsite - Mon through Tue.',
    attendeeIds: ['usr_1001', 'usr_1002', 'usr_1003'],
  },
  {
    id: 'ev_4',
    title: 'Team planning',
    start: `${new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10)}T14:00`,
    end: `${new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10)}T16:00`,
    calendarId: 'internal',
    colorKey: 'gray',
    description: 'Sprint priorities and capacity for next week.',
    attendeeIds: ['usr_1001', 'usr_1003', 'usr_1004'],
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

export function useShowcaseCalendarDemo() {
  return useCalendarRuntime(SHOWCASE_CALENDAR_EVENTS, SHOWCASE_CALENDAR_SOURCES);
}
