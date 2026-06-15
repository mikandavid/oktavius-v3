import { useSearchParams } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { CrudListShell } from '@/components/data/CrudListShell';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { supportPageIcon } from '@/lib/modulePageIcons';
import { useListPageState } from '@/lib/useListPageState';

import { useSupportStats, useSupportTickets } from './data/useSupportData';
import { inboxColumns, type TicketRow, toTicketRow } from './shared';
import { SupportTicketDetail } from './SupportTicketDetail';

interface StatTileProps {
  label: string;
  value: number;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-card px-4 py-3">
      <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function SupportInboxPage() {
  const { ready } = usePreloadNamespaces(['support']);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const ticketId = searchParams.get('ticket');

  // v1 limitation: list is capped at the first 50 tickets fetched server-side;
  // client-side pagination is applied via useListPageState below.
  // Server-side pagination wiring is deferred to a future iteration.
  const { data, isLoading } = useSupportTickets({
    page: 1,
    pageSize: 50,
    sort: '-updated_at',
  });

  const { data: stats } = useSupportStats(!ticketId);

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));

  const listState = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: [],
    searchKeys: ['subject', 'message', 'requester'],
    queryNamespace: 'support-inbox',
  });

  function openTicket(id: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('ticket', id);
      return next;
    });
  }

  function clearTicketParam() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('ticket');
      return next;
    });
  }

  if (!ready) return null;

  if (ticketId) {
    return (
      <ModulePage title={t('support.inboxTitle')} icon={supportPageIcon()}>
        <SupportTicketDetail ticketId={ticketId} onBack={clearTicketParam} admin />
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title={t('support.inboxTitle')}
      subtitle={t('support.inboxDescription')}
      icon={supportPageIcon()}
    >
      {/* Stats strip */}
      <div className="flex flex-wrap gap-3">
        <StatTile label={t('support.statRowOpen')} value={stats?.open ?? 0} />
        <StatTile label={t('support.statRowInProgress')} value={stats?.inProgress ?? 0} />
        <StatTile label={t('support.statRowResolved')} value={stats?.resolved ?? 0} />
      </div>

      {/* Org-wide ticket queue */}
      <CrudListShell<TicketRow>
        search={listState.search}
        onSearchChange={listState.onSearchChange}
        rows={listState.paged}
        columns={inboxColumns(t)}
        sort={listState.sort}
        onSortChange={listState.onSortChange}
        page={listState.page}
        pageSize={listState.pageSize}
        total={listState.total}
        totalPages={listState.totalPages}
        onPageChange={listState.onPageChange}
        isLoading={isLoading}
        onRowClick={(row) => openTicket(row.id)}
        emptyTitle={t('support.emptyInboxTitle')}
        emptyDescription={t('support.emptyInboxDescription')}
        enableListCrud={false}
      />
    </ModulePage>
  );
}
