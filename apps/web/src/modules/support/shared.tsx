import { type BadgeProps, RelativeTime } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import type { FilterDef } from '@/components/data/FilterToolbar';
import { StatusBadge } from '@/components/feedback/StatusBadge';

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

type TFn = (key: string, vars?: Record<string, unknown>) => string;

export function ticketColumns(opts: {
  t: TFn;
  admin: boolean;
  isUnread: (row: TicketRow) => boolean;
}): CrudColumn<TicketRow>[] {
  const { t, admin, isUnread } = opts;
  const columns: CrudColumn<TicketRow>[] = [
    {
      key: 'subject',
      header: t('support.colSubject'),
      sortable: true,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          {isUnread(row) ? (
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-info"
              role="img"
              aria-label={t('support.unreadIndicator')}
            />
          ) : null}
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-foreground">{row.subject}</span>
            {admin ? (
              <span className="truncate text-xs text-muted-foreground">{row.requester}</span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('support.colStatus'),
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={t(`support.statusLabel_${row.status}`)}
          variantMap={STATUS_VARIANT}
        />
      ),
    },
  ];
  if (admin) {
    columns.push({
      key: 'priority',
      header: t('support.colPriority'),
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.priority}
          label={t(`support.priorityLabel_${row.priority}`)}
          variantMap={PRIORITY_VARIANT}
        />
      ),
    });
  }
  columns.push(
    { key: 'categoryLabel', header: t('support.colCategory'), sortable: true },
    {
      key: 'updatedAt',
      header: t('support.colUpdated'),
      sortable: true,
      render: (row) => <RelativeTime date={row.updatedAt} />,
    },
  );
  return columns;
}

export function ticketFilters(opts: { t: TFn; admin: boolean }): FilterDef[] {
  const { t, admin } = opts;
  const filters: FilterDef[] = [
    {
      key: 'status',
      label: t('support.colStatus'),
      options: (['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => ({
        value: s,
        label: t(`support.statusLabel_${s}`),
      })),
    },
  ];
  if (admin) {
    filters.push(
      {
        key: 'priority',
        label: t('support.colPriority'),
        options: (['urgent', 'high', 'normal', 'low'] as const).map((p) => ({
          value: p,
          label: t(`support.priorityLabel_${p}`),
        })),
      },
      {
        key: 'category',
        label: t('support.colCategory'),
        options: (['bug', 'feature_request', 'other'] as const).map((c) => ({
          value: c,
          label: t(`support.categoryLabel_${c}`),
        })),
      },
    );
  }
  return filters;
}
