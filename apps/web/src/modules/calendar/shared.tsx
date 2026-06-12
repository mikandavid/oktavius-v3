import {
  type CalendarEvent,
  type CalendarEventEditorDraft,
  type CalendarEventMoveTarget,
  type CalendarEventResizeTarget,
  type CalendarSlotAnchor,
  type CalendarSource,
  type CalendarTeamMember,
  createCalendarEventTimesFromSlot,
  eventToEditorDraft,
  filterEventsByTeamMembers,
  moveCalendarEvent,
  normalizeSlotRange,
  resizeCalendarEvent,
} from '@oktavius/base-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { appToast } from '@/lib/toast';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

export function useCalendarTeamMembers(): CalendarTeamMember[] {
  const osirisRuntime = useOptionalOsirisRuntime();
  return useMemo(() => {
    if (!osirisRuntime?.currentUser.id) return [];
    const activeMembership = osirisRuntime.memberships.find(
      (membership) => membership.org_id === osirisRuntime.activeOrgId && membership.is_active,
    );

    return [
      {
        id: osirisRuntime.currentUser.id,
        label:
          osirisRuntime.currentUser.fullName ?? osirisRuntime.currentUser.email ?? 'Current user',
        description: activeMembership?.role ?? undefined,
      },
    ];
  }, [
    osirisRuntime?.activeOrgId,
    osirisRuntime?.currentUser.email,
    osirisRuntime?.currentUser.fullName,
    osirisRuntime?.currentUser.id,
    osirisRuntime?.memberships,
  ]);
}

export function useCalendarRuntime(
  initialEvents: CalendarEvent[] = [],
  initialCalendars: CalendarSource[] = [],
) {
  const [events, setEvents] = useState(initialEvents);
  const [calendars, setCalendars] = useState(initialCalendars);
  const [editorDraft, setEditorDraft] = useState<CalendarEventEditorDraft | null>(null);
  const teamMembers = useCalendarTeamMembers();
  const allTeamMemberIds = useMemo(() => teamMembers.map((member) => member.id), [teamMembers]);
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>(allTeamMemberIds);

  useEffect(() => {
    setSelectedTeamMemberIds((current) => {
      const preserved = current.filter((id) => allTeamMemberIds.includes(id));
      if (preserved.length > 0) return preserved;
      return allTeamMemberIds;
    });
  }, [allTeamMemberIds]);

  const onTeamMemberVisibilityChange = useCallback((memberId: string, visible: boolean) => {
    setSelectedTeamMemberIds((current) => {
      if (visible) {
        return current.includes(memberId) ? current : [...current, memberId];
      }
      return current.filter((id) => id !== memberId);
    });
  }, []);

  const onSelectAllTeamMembers = useCallback(() => {
    setSelectedTeamMemberIds(allTeamMemberIds);
  }, [allTeamMemberIds]);

  const onClearTeamMembers = useCallback(() => {
    setSelectedTeamMemberIds([]);
  }, []);

  const visibleEvents = useMemo(
    () =>
      filterEventsByTeamMembers(
        events.filter((event) => {
          const source = calendars.find((cal) => cal.id === event.calendarId);
          return source?.visible !== false;
        }),
        selectedTeamMemberIds,
        allTeamMemberIds,
      ),
    [events, calendars, selectedTeamMemberIds, allTeamMemberIds],
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
      appToast.success(`Moved "${event.title}" to all day.`);
      return;
    }
    if (event.allDay && target.time) {
      appToast.success(`Moved "${event.title}" to ${target.time}.`);
      return;
    }
    appToast.success(`Moved "${event.title}".`);
  }, []);

  const onEventResize = useCallback((event: CalendarEvent, target: CalendarEventResizeTarget) => {
    setEvents((current) =>
      current.map((entry) =>
        entry.id === event.id ? resizeCalendarEvent(entry, target, 15) : entry,
      ),
    );
    appToast.success(`Updated "${event.title}".`);
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
        endDay: day,
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
    appToast.success(`Saved "${event.title}".`);
  }, []);

  const cancelEditor = useCallback(() => {
    setEditorDraft(null);
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents((current) => {
      const removed = current.find((entry) => entry.id === eventId);
      if (removed) appToast.success(`Deleted "${removed.title}".`);
      return current.filter((entry) => entry.id !== eventId);
    });
    setEditorDraft(null);
  }, []);

  const createDraft = editorDraft && !editorDraft.eventId ? editorDraft : null;
  const editDraft = editorDraft?.eventId ? editorDraft : null;

  return {
    events: visibleEvents,
    calendars,
    teamMembers,
    selectedTeamMemberIds,
    onTeamMemberVisibilityChange,
    onSelectAllTeamMembers,
    onClearTeamMembers,
    editorDraft,
    createDraft,
    editDraft,
    onCalendarVisibilityChange,
    onEventMove,
    onEventResize,
    onEventClick,
    onSlotClick,
    onSlotRangeSelect,
    confirmSave,
    cancelEditor,
    deleteEvent,
  };
}
