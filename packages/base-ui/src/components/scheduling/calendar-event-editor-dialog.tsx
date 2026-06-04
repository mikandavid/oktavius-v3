import { useCallback } from 'react';

import { Button } from '../button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { type CalendarSource } from './calendar-colors';
import {
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

export interface CalendarEventEditorDialogProps {
  /**
   * Active draft — populated for both create (no `eventId`) and edit modes.
   * Render-suppressed when `null`.
   */
  draft: CalendarEventEditorDraft | null;
  calendars?: CalendarSource[];
  teamMembers?: CalendarTeamMember[];
  defaultCalendarId?: string;
  onOpenChange: (open: boolean) => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

/**
 * Compact event editor dialog — used for new entry creation AND existing entry
 * edits. Mirrors the email composer surface: framed body, single-row footer,
 * transparent backdrop so the underlying calendar grid (and the originating
 * slot) stays visible while editing.
 */
export function CalendarEventEditorDialog({
  draft,
  calendars,
  teamMembers = [],
  defaultCalendarId,
  onOpenChange,
  onSave,
  onDelete,
}: CalendarEventEditorDialogProps) {
  const open = Boolean(draft);
  const isEdit = Boolean(draft?.eventId);
  const form = useCalendarEventForm({ draft, calendars, defaultCalendarId });

  const handleSave = useCallback(() => {
    const event = form.buildEvent();
    if (!event) return;
    onSave(event);
    onOpenChange(false);
  }, [form, onOpenChange, onSave]);

  const handleCancel = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleDelete = useCallback(() => {
    if (!draft?.eventId || !onDelete) return;
    onDelete(draft.eventId);
    onOpenChange(false);
  }, [draft?.eventId, onDelete, onOpenChange]);

  if (!draft || !form.activeDraft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-lg flex-col gap-0 border-border/60 p-0 shadow-elevated">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => handleCalendarEventFormSubmit(event, handleSave)}
        >
          <DialogHeader className="border-b border-border/40 px-5 py-3 text-left">
            <DialogTitle className="text-base">{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
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
              variant="dialog"
              showDateFields
            />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border/40 px-5 py-3">
            <div className="flex items-center gap-1.5">
              {isEdit && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="cta" size="sm" disabled={!form.title.trim()}>
                {isEdit ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
