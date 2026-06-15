// SupportRequesterView — extracted body of the requester (My requests) experience.
// Does NOT render ModulePage; that is the orchestrator's (SupportPage) responsibility.
//
// Design choice: ReportProblemDialog state is lifted to the orchestrator (SupportPage)
// so the "Report a problem" CTA can live in ModulePage's actions bar alongside the
// superadmin view-toggle. SupportRequesterView is therefore stateless with respect to
// the dialog; it only needs to know when a ticket is opened.

import { Tabs, TabsList, TabsTrigger } from '@oktavius/base-ui';
import { useState } from 'react';

import { CrudListShell } from '@/components/data/CrudListShell';
import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import type { SupportStatus } from './data/types';
import { useSupportTickets } from './data/useSupportData';
import { inboxColumns, type TicketRow, toTicketRow } from './shared';

const STATUS_TABS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

interface SupportRequesterViewProps {
  onOpenTicket: (id: string) => void;
}

export function SupportRequesterView({ onOpenTicket }: SupportRequesterViewProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<StatusTab>('all');

  const statusFilter: SupportStatus | undefined =
    tab === 'all' ? undefined : (tab as SupportStatus);

  // v1 limitation: list is capped at the first 50 tickets fetched server-side;
  // client-side pagination is applied via useListPageState below.
  // Server-side pagination wiring is deferred to a future iteration.
  const { data, isLoading } = useSupportTickets({
    page: 1,
    pageSize: 50,
    status: statusFilter,
    sort: '-updated_at',
  });

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));

  const listState = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: [],
    searchKeys: ['subject', 'message'],
    queryNamespace: 'support',
  });

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList>
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s === 'all' ? t('support.filterAll') : t(`support.statusLabel_${s}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
        emptyTitle={t('support.noTickets')}
        enableListCrud={false}
      />
    </>
  );
}
