import { format, isSameDay, startOfDay } from 'date-fns';
import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Button } from '../button';
import { Input } from '../input';
import { MultiSelect } from '../multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Switch } from '../switch';
import { Textarea } from '../textarea';
import { CALENDAR_COLOR_STYLES, type CalendarSource } from './calendar-colors';
import { createCalendarEventTimesFromRange } from './calendar-dnd';
import type {
  CalendarEvent,
  CalendarEventEditorDraft,
  CalendarTeamMember,
} from './calendar-shared';

export function draftToEvent(
  draft: CalendarEventEditorDraft,
  title: string,
  calendarId: string,
  allDay: boolean,
  description: string,
  attendeeIds: string[],
  calendars?: CalendarSource[],
): CalendarEvent {
  const source = calendars?.find((cal) => cal.id === calendarId);
  const colorKey = source?.color ?? 'blue';
  const trimmedDescription = description.trim();
  const details = {
    ...(trimmedDescription ? { description: trimmedDescription } : {}),
    ...(attendeeIds.length > 0 ? { attendeeIds } : {}),
  };

  const startDay = startOfDay(draft.day);
  const endDay = startOfDay(draft.endDay ?? draft.day);
  const normalizedEndDay = endDay.getTime() < startDay.getTime() ? startDay : endDay;

  if (allDay) {
    return {
      id: draft.eventId ?? `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      start: format(startDay, 'yyyy-MM-dd'),
      end: format(normalizedEndDay, 'yyyy-MM-dd'),
      allDay: true,
      calendarId,
      colorKey,
      ...details,
    };
  }

  const { start, end } = createCalendarEventTimesFromRange(
    startDay,
    normalizedEndDay,
    draft.startTime,
    draft.endTime,
  );

  return {
    id: draft.eventId ?? `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    start,
    end,
    allDay: false,
    calendarId,
    colorKey,
    ...details,
  };
}

export function formatDraftTimeRange(draft: CalendarEventEditorDraft, allDay: boolean): string {
  const startDay = startOfDay(draft.day);
  const endDay = startOfDay(draft.endDay ?? draft.day);
  const multiDay = !isSameDay(startDay, endDay);

  if (allDay) {
    if (multiDay) {
      return `${format(startDay, 'EEE, d MMM')} – ${format(endDay, 'EEE, d MMM')} · All day`;
    }
    return format(startDay, 'EEE, d MMM') + ' · All day';
  }

  const { start, end } = createCalendarEventTimesFromRange(
    startDay,
    endDay,
    draft.startTime,
    draft.endTime,
  );
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (multiDay) {
    return `${format(startDay, 'EEE, d MMM')} ${format(startDate, 'HH:mm')} – ${format(endDay, 'EEE, d MMM')} ${format(endDate, 'HH:mm')}`;
  }

  return `${format(startDay, 'EEE, d MMM')} · ${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}`;
}

export interface UseCalendarEventFormOptions {
  draft: CalendarEventEditorDraft | null;
  calendars?: CalendarSource[];
  defaultCalendarId?: string;
}

export function useCalendarEventForm({
  draft,
  calendars,
  defaultCalendarId,
}: UseCalendarEventFormOptions) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [calendarId, setCalendarId] = useState(
    defaultCalendarId ?? calendars?.[0]?.id ?? 'internal',
  );
  const [allDay, setAllDay] = useState(false);
  const [dayValue, setDayValue] = useState('');
  const [endDayValue, setEndDayValue] = useState('');
  const [times, setTimes] = useState<{ startTime: string; endTime: string } | null>(null);

  const isEdit = Boolean(draft?.eventId);

  const activeDraft = useMemo(
    () =>
      draft
        ? {
            ...draft,
            day: dayValue ? new Date(`${dayValue}T12:00:00`) : draft.day,
            endDay: endDayValue ? new Date(`${endDayValue}T12:00:00`) : (draft.endDay ?? draft.day),
            startTime: times?.startTime ?? draft.startTime,
            endTime: times?.endTime ?? draft.endTime,
          }
        : null,
    [dayValue, draft, endDayValue, times],
  );

  useEffect(() => {
    if (!draft) {
      setTitle('');
      setDescription('');
      setAttendeeIds([]);
      setTimes(null);
      setAllDay(false);
      setDayValue('');
      setEndDayValue('');
      return;
    }
    setTitle(draft.title ?? '');
    setDescription(draft.description ?? '');
    setAttendeeIds(draft.attendeeIds ?? []);
    setTimes({ startTime: draft.startTime, endTime: draft.endTime });
    setAllDay(Boolean(draft.allDay));
    setDayValue(format(draft.day, 'yyyy-MM-dd'));
    setEndDayValue(format(draft.endDay ?? draft.day, 'yyyy-MM-dd'));
    setCalendarId(draft.calendarId ?? defaultCalendarId ?? calendars?.[0]?.id ?? 'internal');
  }, [calendars, defaultCalendarId, draft]);

  const buildEvent = useCallback(() => {
    if (!activeDraft || !title.trim()) return null;
    return draftToEvent(
      activeDraft,
      title,
      calendarId,
      allDay,
      description,
      attendeeIds,
      calendars,
    );
  }, [activeDraft, allDay, attendeeIds, calendarId, calendars, description, title]);

  return {
    isEdit,
    activeDraft,
    title,
    setTitle,
    description,
    setDescription,
    attendeeIds,
    setAttendeeIds,
    calendarId,
    setCalendarId,
    allDay,
    setAllDay,
    dayValue,
    setDayValue,
    endDayValue,
    setEndDayValue,
    times,
    setTimes,
    buildEvent,
  };
}

export interface CalendarEventFormFieldsProps {
  draft: CalendarEventEditorDraft;
  activeDraft: CalendarEventEditorDraft;
  calendars?: CalendarSource[];
  teamMembers?: CalendarTeamMember[];
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  attendeeIds: string[];
  onAttendeeIdsChange: (value: string[]) => void;
  calendarId: string;
  onCalendarIdChange: (value: string) => void;
  allDay: boolean;
  onAllDayChange: (value: boolean) => void;
  dayValue: string;
  onDayValueChange: (value: string) => void;
  endDayValue: string;
  onEndDayValueChange: (value: string) => void;
  times: { startTime: string; endTime: string } | null;
  onTimesChange: (value: { startTime: string; endTime: string } | null) => void;
  /** Inline title (popover) vs labeled field (dialog). */
  variant?: 'inline' | 'dialog';
  showDateFields?: boolean;
}

export function CalendarEventFormFields({
  draft,
  activeDraft,
  calendars,
  teamMembers = [],
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  attendeeIds,
  onAttendeeIdsChange,
  calendarId,
  onCalendarIdChange,
  allDay,
  onAllDayChange,
  dayValue,
  onDayValueChange,
  endDayValue,
  onEndDayValueChange,
  times,
  onTimesChange,
  variant = 'inline',
  showDateFields = false,
}: CalendarEventFormFieldsProps) {
  const titleId = useId();
  const descriptionId = useId();
  const attendeesId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const isDialog = variant === 'dialog';

  const attendeeOptions = teamMembers.map((member) => ({
    value: member.id,
    label: member.label,
    description: member.description,
  }));

  return (
    <>
      {isDialog ? (
        <div className="space-y-1">
          <label
            htmlFor={titleId}
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Title
          </label>
          <Input
            id={titleId}
            autoFocus
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Event title"
            className="h-9"
          />
        </div>
      ) : (
        <Input
          id={titleId}
          autoFocus
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Add title"
          className="h-10 border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0"
          aria-label="Event title"
        />
      )}

      <div className={isDialog ? 'space-y-3' : 'space-y-2 border-t border-border/40 pt-3'}>
        {showDateFields ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor={startDateId}
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                Start date
              </label>
              <Input
                id={startDateId}
                type="date"
                value={dayValue}
                max={endDayValue || undefined}
                onChange={(event) => {
                  const nextStart = event.target.value;
                  onDayValueChange(nextStart);
                  if (endDayValue && nextStart > endDayValue) {
                    onEndDayValueChange(nextStart);
                  }
                }}
                className="h-8 text-sm tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor={endDateId}
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                End date
              </label>
              <Input
                id={endDateId}
                type="date"
                value={endDayValue}
                min={dayValue || undefined}
                onChange={(event) => onEndDayValueChange(event.target.value)}
                className="h-8 text-sm tabular-nums"
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {formatDraftTimeRange(activeDraft, allDay)}
          </p>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={allDay} onCheckedChange={onAllDayChange} aria-label="All day" />
            All day
          </label>
        </div>

        {!allDay ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Start
              </span>
              <Input
                type="time"
                value={activeDraft.startTime}
                onChange={(event) =>
                  onTimesChange({
                    startTime: event.target.value,
                    endTime: times?.endTime ?? draft.endTime,
                  })
                }
                className="h-8 text-xs tabular-nums"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                End
              </span>
              <Input
                type="time"
                value={activeDraft.endTime}
                onChange={(event) =>
                  onTimesChange({
                    startTime: times?.startTime ?? draft.startTime,
                    endTime: event.target.value,
                  })
                }
                className="h-8 text-xs tabular-nums"
              />
            </label>
          </div>
        ) : null}
      </div>

      {calendars && calendars.length > 0 ? (
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Calendar
          </span>
          <Select value={calendarId} onValueChange={onCalendarIdChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {calendars.map((cal) => (
                <SelectItem key={cal.id} value={cal.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${CALENDAR_COLOR_STYLES[cal.color].dot}`}
                    />
                    {cal.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1">
        <label
          htmlFor={descriptionId}
          className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          Description
        </label>
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Add notes, agenda, or location details…"
          rows={isDialog ? 4 : 3}
          className={
            isDialog ? 'min-h-[5.5rem] resize-y text-sm' : 'min-h-[4.5rem] resize-y text-sm'
          }
        />
      </div>

      {teamMembers.length > 0 ? (
        <div className="space-y-1">
          <label
            htmlFor={attendeesId}
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Team members
          </label>
          <MultiSelect
            id={attendeesId}
            options={attendeeOptions}
            value={attendeeIds}
            onChange={onAttendeeIdsChange}
            placeholder="Add people…"
            searchPlaceholder="Search team…"
            maxDisplay={3}
          />
        </div>
      ) : null}
    </>
  );
}

export interface CalendarEventFormActionsProps {
  isEdit: boolean;
  canSave: boolean;
  onCancel: () => void;
  className?: string;
}

export function CalendarEventFormActions({
  isEdit,
  canSave,
  onCancel,
  className,
}: CalendarEventFormActionsProps) {
  return (
    <div
      className={className ?? 'flex items-center justify-end gap-2 border-t border-border/40 pt-3'}
    >
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="cta" size="sm" disabled={!canSave}>
        {isEdit ? 'Save' : 'Create'}
      </Button>
    </div>
  );
}

export function handleCalendarEventFormSubmit(event: FormEvent, onSave: () => void): void {
  event.preventDefault();
  onSave();
}
