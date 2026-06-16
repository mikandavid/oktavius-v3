import type { BadgeProps } from '@oktavius/base-ui';

import type { SupportStatus, SupportTicket } from './data/types';

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

export type StatusGroup = 'open' | 'closed';

export function statusGroupOf(status: SupportStatus): StatusGroup {
  return status === 'open' || status === 'in_progress' ? 'open' : 'closed';
}

/** Row shape consumed by useListPageState (requires `id`). */
export type TicketRow = SupportTicket & {
  requester: string;
  statusLabel: string;
  priorityLabel: string;
  categoryLabel: string;
  statusGroup: StatusGroup;
};

export function toTicketRow(ticket: SupportTicket, t: (key: string) => string): TicketRow {
  return {
    ...ticket,
    requester: ticket.userName ?? ticket.userEmail,
    statusLabel: t(`support.statusLabel_${ticket.status}`),
    priorityLabel: t(`support.priorityLabel_${ticket.priority}`),
    categoryLabel: t(`support.categoryLabel_${ticket.category}`),
    statusGroup: statusGroupOf(ticket.status),
  };
}
