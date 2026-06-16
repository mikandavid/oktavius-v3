import { Badge, SectionCard } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { ExternalLinkIcon } from '@/lib/icons';

import type { SupportAutomationStatus, SupportTicket } from './data/types';

interface AutomationPanelProps {
  ticket: SupportTicket;
}

const AUTOMATION_VARIANT: Record<
  Exclude<SupportAutomationStatus, 'not_requested'>,
  'info' | 'success' | 'warning' | 'destructive' | 'secondary'
> = {
  queued: 'info',
  pr_created: 'success',
  needs_input: 'warning',
  no_changes: 'secondary',
  failed: 'destructive',
};

export function AutomationPanel({ ticket }: AutomationPanelProps) {
  const { t } = useTranslation();
  const status = ticket.automationStatus;

  if (!status || status === 'not_requested') return null;

  return (
    <SectionCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{t('support.automationTitle')}</span>
        <Badge variant={AUTOMATION_VARIANT[status] ?? 'secondary'}>
          {t(`support.automationStatus_${status}`)}
        </Badge>
      </div>
      {ticket.automationError ? (
        <p className="text-xs text-destructive">{ticket.automationError}</p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {ticket.automationPrUrl ? (
          <a
            href={ticket.automationPrUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon size={14} aria-hidden />
            {t('support.automationViewPr')}
          </a>
        ) : null}
        {ticket.automationWorkflowRunUrl ? (
          <a
            href={ticket.automationWorkflowRunUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon size={14} aria-hidden />
            {t('support.automationViewRun')}
          </a>
        ) : null}
      </div>
    </SectionCard>
  );
}
