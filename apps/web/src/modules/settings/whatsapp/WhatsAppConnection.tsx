import { Badge } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { WhatsAppConnectionIcon } from '@/lib/icons';

import { useWhatsAppStatus } from './data/useWhatsApp';

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function WhatsAppConnection() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useWhatsAppStatus();

  const isConnected = status?.status === 'connected';
  const isConnecting = status?.status === 'connecting';

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <WhatsAppConnectionIcon size={14} className="text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('settings.whatsappConnection', undefined, 'Connection')}
        </h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          {t('common.loading', undefined, 'Loading…')}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {t('settings.whatsappBotTitle', undefined, 'WhatsApp bot')}
                </p>
                <Badge variant={isConnected ? 'success' : isConnecting ? 'warning' : 'outline'}>
                  {isConnected
                    ? t('settings.whatsappConnected', undefined, 'Connected')
                    : isConnecting
                      ? t('settings.whatsappConnecting', undefined, 'Connecting')
                      : t('settings.whatsappDisconnected', undefined, 'Disconnected')}
                </Badge>
              </div>
              {isConnected && status?.phoneNumber ? (
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {status.phoneNumber}
                </p>
              ) : null}
            </div>
            {isConnected && status?.uptime != null ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {t('settings.whatsappUptime', undefined, 'Uptime')}: {formatUptime(status.uptime)}
              </span>
            ) : null}
          </div>

          {!isConnected && !isConnecting ? (
            <p data-testid="wa-pairing-hint" className="text-xs text-muted-foreground">
              {t(
                'settings.whatsappPairingHint',
                undefined,
                'The bot is not paired. Pair it from the server to enable messaging.',
              )}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
