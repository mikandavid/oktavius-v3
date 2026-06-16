// SupportRequesterView — the standard support surface every non-superadmin sees.
// Lighter issue list: Open/Closed toggle + search only. No admin dropdowns.
// ReportProblemDialog state lives in SupportPage (CTA sits in ModulePage actions).
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { useSupportTickets } from './data/useSupportData';
import { useSupportUnread } from './data/useSupportUnread';
import { IssueFilterBar } from './IssueFilterBar';
import { IssueList } from './IssueList';
import { type StatusGroup, type TicketRow, toTicketRow } from './shared';

interface SupportRequesterViewProps {
  onOpenTicket: (id: string) => void;
}

export function SupportRequesterView({ onOpenTicket }: SupportRequesterViewProps) {
  const { t } = useTranslation();
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('open');
  const { isUnread } = useSupportUnread();

  // 50-row server cap retained (documented v1 limitation). Filtering is client-side.
  const { data, isLoading } = useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' });

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));
  const openCount = rows.filter((r) => r.statusGroup === 'open').length;
  const closedCount = rows.filter((r) => r.statusGroup === 'closed').length;

  const listState = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: ['statusGroup'],
    initialFilters: { statusGroup: 'open' },
    searchKeys: ['subject', 'message'],
    queryNamespace: 'support',
  });

  // Keep the toggle and the list-state filter in sync.
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
      />
      <IssueList
        rows={listState.paged}
        isLoading={isLoading}
        emptyText={t('support.noTickets')}
        onOpenTicket={onOpenTicket}
        page={listState.page}
        pageSize={listState.pageSize}
        total={listState.total}
        totalPages={listState.totalPages}
        onPageChange={listState.onPageChange}
        isUnread={isUnread}
      />
    </div>
  );
}
