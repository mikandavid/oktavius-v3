/**
 * Pure presentation helpers for the automations UI.
 * No JSX — badge components are exported from here too so both list and detail
 * can import from a single place.
 *
 * Ported from osiris_erp automationPresentation.tsx, converted to .ts (no JSX).
 * Badge components remain in AutomationsList.tsx / AutomationDetail.tsx inline.
 */

import type {
  RunTriggerContext,
  ScheduledTask,
  ScheduleType,
  TriggerConfig,
} from '@/runtime/osiris/schedulerClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TFunction = (
  key: string,
  params?: Record<string, string | number>,
  defaultValue?: string,
) => string;

export type FormatDateTime = (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;

// ---------------------------------------------------------------------------
// Human-readable schedule
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;

/** Interval expressions are plain milliseconds or an ISO-8601 duration (PnDTnHnMnS). */
function parseIntervalToMs(expression: string): number | null {
  const trimmed = expression.trim();
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric > 0) return Math.floor(numeric);

  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(trimmed);
  if (!match) return null;
  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match;
  const ms =
    Number(days) * MS_PER_DAY +
    Number(hours) * MS_PER_HOUR +
    Number(minutes) * MS_PER_MINUTE +
    Number(seconds) * 1_000;
  return ms > 0 ? ms : null;
}

export function describeSchedule(
  task: Pick<ScheduledTask, 'scheduleType' | 'scheduleExpression'> & {
    scheduleType: ScheduleType;
    triggerConfig?: ScheduledTask['triggerConfig'];
  },
  t: TFunction,
  formatDateTime: FormatDateTime,
): string {
  if (task.scheduleType === 'event') {
    return describeTrigger(task.triggerConfig ?? null, t);
  }

  if (task.scheduleType === 'once') {
    const date = new Date(task.scheduleExpression);
    const when = Number.isNaN(date.getTime())
      ? task.scheduleExpression
      : formatDateTime(date, { dateStyle: 'medium', timeStyle: 'short' });
    return t('scheduler.automations.scheduleOnceAt', { when });
  }

  if (task.scheduleType === 'interval') {
    const ms = parseIntervalToMs(task.scheduleExpression);
    if (ms !== null) {
      if (ms % MS_PER_DAY === 0) {
        return t('scheduler.automations.everyDays', { count: ms / MS_PER_DAY });
      }
      if (ms % MS_PER_HOUR === 0) {
        return t('scheduler.automations.everyHours', { count: ms / MS_PER_HOUR });
      }
      if (ms % MS_PER_MINUTE === 0) {
        return t('scheduler.automations.everyMinutes', { count: ms / MS_PER_MINUTE });
      }
      return t('scheduler.automations.everySeconds', { count: Math.round(ms / 1_000) });
    }
    return t('scheduler.automations.everyDuration', { duration: task.scheduleExpression });
  }

  return t('scheduler.automations.scheduleCron', { expression: task.scheduleExpression });
}

// ---------------------------------------------------------------------------
// Trigger presentation
// ---------------------------------------------------------------------------

export function describeTrigger(
  triggerConfig: TriggerConfig | null | undefined,
  t: TFunction,
): string {
  if (triggerConfig?.kind === 'email_received') {
    return t('scheduler.automations.trigger.emailReceived');
  }
  if (triggerConfig?.kind === 'halo_ticket_created') {
    return t('scheduler.automations.trigger.haloTicketCreated');
  }
  return t('scheduler.automations.trigger.generic');
}

/** Summarize the configured filter groups for the detail page. */
export function describeTriggerFilters(
  triggerConfig: ScheduledTask['triggerConfig'],
  t: TFunction,
): string[] {
  if (!triggerConfig) return [];
  const parts: string[] = [];
  if (triggerConfig.kind === 'email_received') {
    if (triggerConfig.senders?.length) {
      parts.push(
        t('scheduler.automations.trigger.filterSenders', {
          values: triggerConfig.senders.join(', '),
        }),
      );
    }
    if (triggerConfig.keywords?.length) {
      parts.push(
        t('scheduler.automations.trigger.filterKeywords', {
          values: triggerConfig.keywords.join(', '),
        }),
      );
    }
    if (triggerConfig.attachments === 'any') {
      parts.push(t('scheduler.automations.trigger.filterAttachmentsAny'));
    } else if (Array.isArray(triggerConfig.attachments) && triggerConfig.attachments.length) {
      parts.push(
        t('scheduler.automations.trigger.filterAttachmentTypes', {
          values: triggerConfig.attachments
            .map((type) => t(`scheduler.automations.trigger.attachmentType.${type}`))
            .join(', '),
        }),
      );
    }
  }
  if (triggerConfig.kind === 'halo_ticket_created') {
    if (triggerConfig.priorityIds?.length) {
      parts.push(
        t('scheduler.automations.trigger.filterPriorities', {
          values: triggerConfig.priorityIds.join(', '),
        }),
      );
    }
    if (triggerConfig.statusIds?.length) {
      parts.push(
        t('scheduler.automations.trigger.filterStatuses', {
          values: triggerConfig.statusIds.join(', '),
        }),
      );
    }
    if (triggerConfig.clientIds?.length) {
      parts.push(
        t('scheduler.automations.trigger.filterClients', {
          values: triggerConfig.clientIds.join(', '),
        }),
      );
    }
  }
  if (parts.length === 0) {
    parts.push(t('scheduler.automations.trigger.noFilters'));
  }
  return parts;
}

/** One-line description of what fired a trigger run, from the run's stored event context. */
export function describeRunTrigger(context: RunTriggerContext | undefined): string | null {
  if (!context) return null;
  if (context.kind === 'email_received') {
    const from = context.from ?? '';
    const subject = context.subject ?? '';
    if (!from && !subject) return null;
    return subject ? `${from} — ${subject}` : from;
  }
  if (context.kind === 'halo_ticket_created') {
    const summary = context.summary ?? '';
    const ticket = context.ticketId != null ? `#${context.ticketId}` : '';
    if (!summary && !ticket) return null;
    return [ticket, summary].filter(Boolean).join(' ');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Simple inline formatDateTime helper (no useDateTimeFormat hook in v3 i18n)
// ---------------------------------------------------------------------------

export function formatDateTimeSimple(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  try {
    return new Intl.DateTimeFormat(undefined, options).format(
      value instanceof Date ? value : new Date(value),
    );
  } catch {
    return String(value);
  }
}
