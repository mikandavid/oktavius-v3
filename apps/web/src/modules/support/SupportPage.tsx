import { Button } from '@oktavius/base-ui';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon } from '@/lib/icons';
import { supportPageIcon } from '@/lib/modulePageIcons';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { ReportProblemDialog } from './ReportProblemDialog';
import { SupportTicketDetail } from './SupportTicketDetail';
import { SupportTicketList } from './SupportTicketList';

export function SupportPage() {
  const { ready } = usePreloadNamespaces(['support']);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportOpen, setReportOpen] = useState(false);

  // Superadmins get the global issues board; everyone else gets the requester view.
  const isSuperadmin = useOptionalOsirisRuntime()?.permissionSubject?.isSuperadmin ?? false;

  const ticketId = searchParams.get('ticket');

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

  const title = isSuperadmin ? t('support.issuesTitle') : t('support.title');
  const subtitle = isSuperadmin ? t('support.issuesDescription') : undefined;

  // Report-problem CTA only for non-superadmins (superadmins manage, don't file).
  const actions = isSuperadmin ? undefined : (
    <Button variant="cta" onClick={() => setReportOpen(true)}>
      <PlusIcon size={16} aria-hidden />
      {t('support.reportProblem')}
    </Button>
  );

  return (
    <ModulePage title={title} subtitle={subtitle} icon={supportPageIcon()} actions={actions}>
      {ticketId ? (
        <SupportTicketDetail ticketId={ticketId} onBack={clearTicketParam} admin={isSuperadmin} />
      ) : isSuperadmin ? (
        <SupportTicketList admin onOpenTicket={openTicket} />
      ) : (
        <>
          <SupportTicketList admin={false} onOpenTicket={openTicket} />
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
