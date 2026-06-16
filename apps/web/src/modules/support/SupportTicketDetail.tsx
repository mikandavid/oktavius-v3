import { Button } from '@oktavius/base-ui';
import { useEffect } from 'react';

import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useTranslation } from '@/core/i18n';
import { BackIcon } from '@/lib/icons';

import { AutomationPanel } from './AutomationPanel';
import { useSupportTicket } from './data/useSupportData';
import { useSupportUnread } from './data/useSupportUnread';
import { PRIORITY_VARIANT, STATUS_VARIANT } from './shared';
import { SupportTicketThread } from './SupportTicketThread';
import { TriageControls } from './TriageControls';

interface SupportTicketDetailProps {
  ticketId: string;
  onBack: () => void;
  admin?: boolean;
}

export function SupportTicketDetail({ ticketId, onBack, admin }: SupportTicketDetailProps) {
  const { t } = useTranslation();
  const { data: ticket, isLoading } = useSupportTicket(ticketId);
  const { markSeen } = useSupportUnread();

  useEffect(() => {
    if (ticket) markSeen(ticket.id, ticket.updatedAt);
  }, [ticket, markSeen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        {t('support.loading')}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-start gap-3 p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={t('support.backToTickets')}
          onClick={onBack}
        >
          <BackIcon size={16} weight="bold" />
        </Button>
        <p className="text-sm text-muted-foreground">{t('support.ticketNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={t('support.backToTickets')}
            onClick={onBack}
          >
            <BackIcon size={16} weight="bold" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">{ticket.subject}</h2>
        </div>
        <div className="flex items-center gap-2 pl-10">
          <StatusBadge
            status={ticket.status}
            label={t(`support.statusLabel_${ticket.status}`)}
            variantMap={STATUS_VARIANT}
          />
          <StatusBadge
            status={ticket.priority}
            label={t(`support.priorityLabel_${ticket.priority}`)}
            variantMap={PRIORITY_VARIANT}
          />
        </div>
      </div>

      {/* Body grid */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <main>
          <SupportTicketThread ticket={ticket} admin={admin} />
        </main>
        {admin ? (
          <aside className="flex flex-col gap-4">
            <TriageControls ticket={ticket} />
            <AutomationPanel ticket={ticket} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
