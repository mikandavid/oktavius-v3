import type { BadgeProps } from '@oktavius/base-ui';

import { statusColumn } from '@/components/data/columns';
import type { CrudColumn } from '@/components/data/CrudTable';
import { BotIcon, BugIcon, GlobeIcon, LifeBuoyIcon, MailIcon, SparklesIcon } from '@/lib/icons';

import type { SupportCategory, SupportSource, SupportTicket } from './data/types';

export const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  open: 'info',
  in_progress: 'secondary',
  resolved: 'success',
  closed: 'outline',
};

export const PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  urgent: 'destructive',
  high: 'warning',
  normal: 'secondary',
  low: 'outline',
};

export const CATEGORY_ICON = {
  bug: BugIcon,
  feature_request: SparklesIcon,
  other: LifeBuoyIcon,
} as const satisfies Record<SupportCategory, unknown>;

export const SOURCE_ICON = {
  web: GlobeIcon,
  agent: BotIcon,
  email: MailIcon,
} as const satisfies Record<SupportSource, unknown>;

/** Row shape consumed by CrudListShell (requires `id`). */
export type TicketRow = SupportTicket & {
  requester: string;
  statusLabel: string;
  priorityLabel: string;
};

/** Inbox columns. `t` translates headers/labels. */
export function inboxColumns(t: (key: string) => string): CrudColumn<TicketRow>[] {
  return [
    { key: 'subject', header: t('support.colSubject'), sortable: true },
    { key: 'requester', header: t('support.colRequester'), sortable: true, hideBelow: 'md' },
    statusColumn<TicketRow>('priorityLabel', t('support.colPriority'), PRIORITY_VARIANT, {
      sortable: true,
    }),
    statusColumn<TicketRow>('statusLabel', t('support.colStatus'), STATUS_VARIANT, {
      sortable: true,
    }),
    {
      key: 'updatedAt',
      header: t('support.colUpdated'),
      sortable: true,
      type: 'date',
      hideBelow: 'sm',
    },
  ];
}

export function toTicketRow(ticket: SupportTicket, t: (key: string) => string): TicketRow {
  return {
    ...ticket,
    requester: ticket.userName ?? ticket.userEmail,
    statusLabel: t(`support.statusLabel_${ticket.status}`),
    priorityLabel: t(`support.priorityLabel_${ticket.priority}`),
  };
}
