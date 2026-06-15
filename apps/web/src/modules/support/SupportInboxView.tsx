// SupportInboxView — extracted body of the admin inbox (superadmin Inbox) experience.
// Does NOT render ModulePage; that is the orchestrator's (SupportPage) responsibility.

import { CrudListShell } from '@/components/data/CrudListShell';
import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { useSupportStats, useSupportTickets } from './data/useSupportData';
import { inboxColumns, type TicketRow, toTicketRow } from './shared';

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

interface SupportInboxViewProps {
  onOpenTicket: (id: string) => void;
}

export function SupportInboxView({ onOpenTicket }: SupportInboxViewProps) {
  const { t } = useTranslation();

  // v1 limitation: list is capped at the first 50 tickets fetched server-side;
  // client-side pagination is applied via useListPageState below.
  // Server-side pagination wiring is deferred to a future iteration.
  const { data, isLoading } = useSupportTickets({
    page: 1,
    pageSize: 50,
    sort: '-updated_at',
  });

  const { data: stats } = useSupportStats(true);

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));

  const listState = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: [],
    searchKeys: ['subject', 'message', 'requester'],
    queryNamespace: 'support',
  });

  return (
    <>
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
        onRowClick={(row) => onOpenTicket(row.id)}
        emptyTitle={t('support.emptyInboxTitle')}
        emptyDescription={t('support.emptyInboxDescription')}
        enableListCrud={false}
      />
    </>
  );
}
