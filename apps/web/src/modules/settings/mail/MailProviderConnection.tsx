import { Badge } from '@oktavius/base-ui';

import { hostedNylasProviderLabel } from '@/components/common/ConnectedAccountsHeaderMenu';
import { useTranslation } from '@/core/i18n';
import { EmailConnectionIcon } from '@/lib/icons';

import { SUPPORTED_MAIL_PROVIDERS, useMailProviderStatus } from './data/useMailProviderStatus';

export function MailProviderConnection() {
  const { t } = useTranslation();
  const status = useMailProviderStatus();
  const isConnected = status.status === 'connected';

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <EmailConnectionIcon size={14} className="text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('settings.mailConnection', undefined, 'Connection')}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">
            {t('settings.mailMailbox', undefined, 'Mailbox')}
          </p>
          <Badge variant={isConnected ? 'success' : 'outline'}>
            {isConnected
              ? t('settings.mailConnected', undefined, 'Connected')
              : t('settings.mailNoneConnected', undefined, 'No mail provider connected')}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t('settings.mailSupportedProviders', undefined, 'Supported providers')}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {SUPPORTED_MAIL_PROVIDERS.map((provider) => (
              <li key={provider}>
                <Badge variant="outline">{hostedNylasProviderLabel(provider)}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <p data-testid="mail-provider-hint" className="text-xs text-muted-foreground">
          {t(
            'settings.mailNoneConnectedHint',
            undefined,
            'No mail provider is connected, so email cannot be synced or sent yet. Connecting a provider will be available here once mail sync is enabled for your workspace.',
          )}
        </p>
      </div>
    </section>
  );
}
