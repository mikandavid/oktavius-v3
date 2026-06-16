// SupportIssuesView — superadmin global issues board. Full filter bar:
// Open/Closed toggle + search + Priority + Category dropdowns.
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { useSupportStats, useSupportTickets } from './data/useSupportData';
import { IssueFilterBar } from './IssueFilterBar';
import { IssueList } from './IssueList';
import { type StatusGroup, type TicketRow, toTicketRow } from './shared';

const PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const;
const CATEGORIES = ['bug', 'feature_request', 'other'] as const;

interface SupportIssuesViewProps {
  onOpenTicket: (id: string) => void;
}

export function SupportIssuesView({ onOpenTicket }: SupportIssuesViewProps) {
  const { t } = useTranslation();
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('open');

  // 50-row server cap retained (documented v1 limitation). Filtering is client-side.
  const { data, isLoading } = useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' });
  const { data: stats } = useSupportStats(true);

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));

  // Prefer server stats for the counts; fall back to fetched-page counts.
  const openCount = stats
    ? stats.open + stats.inProgress
    : rows.filter((r) => r.statusGroup === 'open').length;
  const closedCount = stats
    ? stats.resolved + stats.closed
    : rows.filter((r) => r.statusGroup === 'closed').length;

  const listState = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: ['statusGroup', 'priority', 'category'],
    initialFilters: { statusGroup: 'open' },
    searchKeys: ['subject', 'message', 'requester'],
    queryNamespace: 'support',
  });

  function handleStatusGroupChange(g: StatusGroup) {
    setStatusGroup(g);
    listState.onFilterChange('statusGroup', g);
  }

  return (
    <div className="flex flex-col gap-4">
      <IssueFilterBar
        openCount={openCount}
        closedCount={closedCount}
        statusGroup={statusGroup}
        onStatusGroupChange={handleStatusGroupChange}
        search={listState.search}
        onSearchChange={listState.onSearchChange}
        searchPlaceholder={t('support.searchPlaceholder')}
        priority={{
          value: listState.filters.priority ?? '',
          onChange: (v) => listState.onFilterChange('priority', v),
          options: PRIORITIES.map((p) => ({ value: p, label: t(`support.priorityLabel_${p}`) })),
        }}
        category={{
          value: listState.filters.category ?? '',
          onChange: (v) => listState.onFilterChange('category', v),
          options: CATEGORIES.map((c) => ({ value: c, label: t(`support.categoryLabel_${c}`) })),
        }}
      />
      <IssueList
        rows={listState.paged}
        isLoading={isLoading}
        emptyText={t('support.emptyInboxTitle')}
        onOpenTicket={onOpenTicket}
        page={listState.page}
        pageSize={listState.pageSize}
        total={listState.total}
        totalPages={listState.totalPages}
        onPageChange={listState.onPageChange}
      />
    </div>
  );
}
