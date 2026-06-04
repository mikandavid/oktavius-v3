import { useCallback } from 'react';

import { Popover, PopoverAnchor, PopoverContent } from '../popover';
import { type CalendarSource } from './calendar-colors';
import {
  CalendarEventFormActions,
  CalendarEventFormFields,
  handleCalendarEventFormSubmit,
  useCalendarEventForm,
} from './calendar-event-form';
import type {
  CalendarEvent,
  CalendarEventEditorDraft,
  CalendarTeamMember,
} from './calendar-shared';

export type {
  CalendarCreateDraft,
  CalendarEventEditorDraft,
  CalendarSlotAnchor,
} from './calendar-shared';

export interface CalendarEventQuickCreateProps {
  draft: CalendarEventEditorDraft | null;
  calendars?: CalendarSource[];
  teamMembers?: CalendarTeamMember[];
  defaultCalendarId?: string;
  onOpenChange: (open: boolean) => void;
  onSave: (event: CalendarEvent) => void;
}

export function CalendarEventQuickCreate({
  draft,
  calendars,
  teamMembers = [],
  defaultCalendarId,
  onOpenChange,
  onSave,
}: CalendarEventQuickCreateProps) {
  const isCreate = draft !== null && !draft.eventId;
  const form = useCalendarEventForm({
    draft: isCreate ? draft : null,
    calendars,
    defaultCalendarId,
  });

  const handleSave = useCallback(() => {
    const event = form.buildEvent();
    if (!event) return;
    onSave(event);
    onOpenChange(false);
  }, [form, onOpenChange, onSave]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleDismiss = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) return;
      if (form.title.trim() && form.activeDraft) {
        const event = form.buildEvent();
        if (event) onSave(event);
      }
      onOpenChange(false);
    },
    [form, onOpenChange, onSave],
  );

  if (!isCreate || !draft || !form.activeDraft) return null;

  return (
    <Popover open onOpenChange={handleDismiss}>
      <PopoverAnchor
        style={{
          position: 'fixed',
          left: draft.anchor.x,
          top: draft.anchor.y,
          width: 1,
          height: 1,
          pointerEvents: 'none',
        }}
      />
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-[min(26rem,calc(100vw-2rem))] p-0"
      >
        <form
          className="flex flex-col gap-3 p-4"
          onSubmit={(event) => handleCalendarEventFormSubmit(event, handleSave)}
        >
          <CalendarEventFormFields
            draft={draft}
            activeDraft={form.activeDraft}
            calendars={calendars}
            teamMembers={teamMembers}
            title={form.title}
            onTitleChange={form.setTitle}
            description={form.description}
            onDescriptionChange={form.setDescription}
            attendeeIds={form.attendeeIds}
            onAttendeeIdsChange={form.setAttendeeIds}
            calendarId={form.calendarId}
            onCalendarIdChange={form.setCalendarId}
            allDay={form.allDay}
            onAllDayChange={form.setAllDay}
            dayValue={form.dayValue}
            onDayValueChange={form.setDayValue}
            endDayValue={form.endDayValue}
            onEndDayValueChange={form.setEndDayValue}
            times={form.times}
            onTimesChange={form.setTimes}
            variant="inline"
            showDateFields
          />

          <CalendarEventFormActions
            isEdit={false}
            canSave={Boolean(form.title.trim())}
            onCancel={handleCancel}
          />
        </form>
      </PopoverContent>
    </Popover>
  );
}
