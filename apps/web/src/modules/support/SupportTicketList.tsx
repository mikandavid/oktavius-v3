import { CrudListShell } from '@/components/data/CrudListShell';
import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { useSupportTickets } from './data/useSupportData';
import { useSupportUnread } from './data/useSupportUnread';
import { ticketColumns, ticketFilters, type TicketRow, toTicketRow } from './shared';

interface SupportTicketListProps {
  admin: boolean;
  onOpenTicket: (id: string) => void;
}

export function SupportTicketList({ admin, onOpenTicket }: SupportTicketListProps) {
  const { t } = useTranslation();
  const { isUnread } = useSupportUnread();

  // 50-row server cap retained (documented v1 limitation). Filtering is client-side.
  const { data, isLoading } = useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' });
  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));

  const list = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: admin ? ['status', 'priority', 'category'] : ['status'],
    searchKeys: admin ? ['subject', 'message', 'requester'] : ['subject', 'message'],
    queryNamespace: 'support',
  });

  return (
    <CrudListShell<TicketRow>
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder={t('support.searchPlaceholder')}
      filters={ticketFilters({ t, admin })}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={ticketColumns({ t, admin, isUnread })}
      sort={list.sort}
      onSortChange={list.onSortChange}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      isLoading={isLoading}
      emptyTitle={admin ? t('support.emptyInboxTitle') : t('support.noTickets')}
      emptyDescription={admin ? t('support.emptyInboxDescription') : undefined}
      onRowClick={(row) => onOpenTicket(row.id)}
      enableListCrud={false}
      entityLabel="ticket"
    />
  );
}
