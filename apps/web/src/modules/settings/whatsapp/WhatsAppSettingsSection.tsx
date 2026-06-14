import { useTranslation } from '@/core/i18n';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { WhatsAppConnection } from './WhatsAppConnection';
import { WhatsAppContactsConfig } from './WhatsAppContactsConfig';

export function WhatsAppSettingsSection() {
  const { t } = useTranslation();
  const activeOrgId = useOptionalOsirisRuntime()?.activeOrgId ?? null;

  if (!activeOrgId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('common.selectOrgRequired', undefined, 'Select an organization first.')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <WhatsAppConnection />
      <div className="border-t border-border/50" />
      <WhatsAppContactsConfig />
    </div>
  );
}
