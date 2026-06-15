import { Button, Tabs, TabsList, TabsTrigger } from '@oktavius/base-ui';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon } from '@/lib/icons';
import { supportPageIcon } from '@/lib/modulePageIcons';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { ReportProblemDialog } from './ReportProblemDialog';
import { SupportInboxView } from './SupportInboxView';
import { SupportRequesterView } from './SupportRequesterView';
import { SupportTicketDetail } from './SupportTicketDetail';

type ViewMode = 'mine' | 'inbox';

export function SupportPage() {
  const { ready } = usePreloadNamespaces(['support']);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportOpen, setReportOpen] = useState(false);

  // Superadmin detection: only superadmins can switch to the inbox view.
  const isSuperadmin = useOptionalOsirisRuntime()?.permissionSubject?.isSuperadmin ?? false;

  const ticketId = searchParams.get('ticket');
  const viewParam = searchParams.get('view');

  // Non-superadmins always see 'mine'; superadmins can request 'inbox' via ?view=inbox.
  const effectiveView: ViewMode = viewParam === 'inbox' && isSuperadmin ? 'inbox' : 'mine';

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

  function handleViewChange(view: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // Clear ticket when switching views to avoid stale detail pane.
      next.delete('ticket');
      if (view === 'inbox') {
        next.set('view', 'inbox');
      } else {
        next.delete('view');
      }
      return next;
    });
  }

  if (!ready) return null;

  const title = effectiveView === 'inbox' ? t('support.inboxTitle') : t('support.title');
  const subtitle = effectiveView === 'inbox' ? t('support.inboxDescription') : undefined;

  const actions = (
    <>
      {isSuperadmin && (
        <Tabs value={effectiveView} onValueChange={handleViewChange}>
          <TabsList>
            <TabsTrigger value="mine">{t('support.viewMine')}</TabsTrigger>
            <TabsTrigger value="inbox">{t('support.viewInbox')}</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {effectiveView === 'mine' && (
        <Button variant="cta" onClick={() => setReportOpen(true)}>
          <PlusIcon size={16} aria-hidden />
          {t('support.reportProblem')}
        </Button>
      )}
    </>
  );

  return (
    <ModulePage title={title} subtitle={subtitle} icon={supportPageIcon()} actions={actions}>
      {ticketId ? (
        <SupportTicketDetail
          ticketId={ticketId}
          onBack={clearTicketParam}
          admin={effectiveView === 'inbox'}
        />
      ) : effectiveView === 'inbox' ? (
        <SupportInboxView onOpenTicket={openTicket} />
      ) : (
        <>
          <SupportRequesterView onOpenTicket={openTicket} />
          <ReportProblemDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            onCreated={(ticket) => {
              setReportOpen(false);
              openTicket(ticket.id);
            }}
          />
        </>
      )}
    </ModulePage>
  );
}
