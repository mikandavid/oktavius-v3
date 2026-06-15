import { Button, Tabs, TabsList, TabsTrigger } from '@oktavius/base-ui';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { CrudListShell } from '@/components/data/CrudListShell';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon } from '@/lib/icons';
import { supportPageIcon } from '@/lib/modulePageIcons';
import { useListPageState } from '@/lib/useListPageState';

import type { SupportStatus } from './data/types';
import { useSupportTickets } from './data/useSupportData';
import { ReportProblemDialog } from './ReportProblemDialog';
import { inboxColumns, type TicketRow, toTicketRow } from './shared';
import { SupportTicketDetail } from './SupportTicketDetail';

const STATUS_TABS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export function SupportPage() {
  const { ready } = usePreloadNamespaces(['support']);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<StatusTab>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const ticketId = searchParams.get('ticket');

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

  const reportButton = (
    <Button variant="cta" onClick={() => setDialogOpen(true)}>
      <PlusIcon size={16} aria-hidden />
      {t('support.reportProblem')}
    </Button>
  );

  return (
    <ModulePage title={t('support.title')} icon={supportPageIcon()} actions={reportButton}>
      {ticketId ? (
        <SupportTicketDetail ticketId={ticketId} onBack={clearTicketParam} />
      ) : (
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
            onRowClick={(row) => openTicket(row.id)}
            emptyTitle={t('support.noTickets')}
            enableListCrud={false}
          />

          <ReportProblemDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onCreated={(ticket) => {
              setDialogOpen(false);
              openTicket(ticket.id);
            }}
          />
        </>
      )}
    </ModulePage>
  );
}
