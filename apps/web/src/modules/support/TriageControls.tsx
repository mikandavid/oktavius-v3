import { Combobox } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';

import type { SupportTicket } from './data/types';
import { STATUSES_FOR_UI } from './triageOptions';

interface TriageControlsProps {
  ticket: SupportTicket;
}

export function TriageControls({ ticket }: TriageControlsProps) {
  const { t } = useTranslation();

  const statusOptions = STATUSES_FOR_UI.map((s) => ({
    value: s,
    label: t(`support.statusLabel_${s}`),
  }));

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4">
      {/* Status select */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{t('common.status')}</span>
          <span className="rounded-control bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {t('support.triageSoon')}
          </span>
        </div>
        <Combobox options={statusOptions} value={ticket.status} disabled clearable={false} />
      </div>

      {/* Assignee select */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{t('support.assigneeLabel')}</span>
          <span className="rounded-control bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {t('support.triageSoon')}
          </span>
        </div>
        <Combobox
          options={[]}
          value={undefined}
          placeholder={t('support.assigneeUnassigned')}
          disabled
        />
      </div>
    </div>
  );
}
