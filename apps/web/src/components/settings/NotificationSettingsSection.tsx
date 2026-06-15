import { Badge, cn, SettingsRow, SettingsSection } from '@oktavius/base-ui';

import type {
  NotificationChannel,
  NotificationExplicitPreferenceState,
  NotificationSettingsChannel,
  NotificationsRuntimeAdapter,
} from '@/components/layout/NotificationsRuntime';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import {
  useNotificationSettings,
  useUpdateNotificationSubscription,
} from './notificationSettingsData';

type NotificationSettingsSectionProps = {
  runtime?: NotificationsRuntimeAdapter;
};

const CHANNEL_LABEL_KEYS: Record<NotificationChannel, string> = {
  in_app: 'profile.notificationChannelInApp',
  email: 'common.email',
  push: 'profile.notificationChannelPush',
  whatsapp: 'profile.notificationChannelWhatsapp',
};

const CHANNEL_FALLBACK_LABELS: Record<NotificationChannel, string> = {
  in_app: 'In-app',
  email: 'Email',
  push: 'Push',
  whatsapp: 'WhatsApp',
};

function stateLabel(
  t: ReturnType<typeof useTranslation>['t'],
  state: NotificationExplicitPreferenceState,
) {
  if (state === 'inherited') return t('profile.notificationStateInherited', undefined, 'Default');
  if (state === 'enabled') return t('profile.notificationStateEnabled', undefined, 'Enabled');
  if (state === 'summary') return t('profile.notificationStateSummary', undefined, 'Summary');
  return t('profile.notificationStateDisabled', undefined, 'Disabled');
}

function channelLabel(t: ReturnType<typeof useTranslation>['t'], channel: NotificationChannel) {
  return t(CHANNEL_LABEL_KEYS[channel], undefined, CHANNEL_FALLBACK_LABELS[channel]);
}

function availableStates(
  channel: NotificationSettingsChannel,
): NotificationExplicitPreferenceState[] {
  return channel.supportsSummary
    ? ['inherited', 'enabled', 'disabled', 'summary']
    : ['inherited', 'enabled', 'disabled'];
}

export function NotificationSettingsSection({ runtime }: NotificationSettingsSectionProps) {
  const { ready } = usePreloadNamespaces(['profile']);
  const { t } = useTranslation();
  const settingsQuery = useNotificationSettings(runtime);
  const updateSubscription = useUpdateNotificationSubscription(runtime);

  const isLoading = settingsQuery.isLoading;
  // The currently-saving control, derived from the in-flight mutation so a
  // single dropdown is disabled while its change persists.
  const savingKey = updateSubscription.isPending
    ? `${updateSubscription.variables.notificationTypeKey}:${updateSubscription.variables.channel}`
    : null;

  const loadError = settingsQuery.error
    ? settingsQuery.error instanceof Error
      ? settingsQuery.error.message
      : t(
          'profile.notificationSettingsLoadError',
          undefined,
          'Failed to load notification preferences.',
        )
    : null;
  const saveError = updateSubscription.error
    ? updateSubscription.error instanceof Error
      ? updateSubscription.error.message
      : t('common.genericError', undefined, 'Something went wrong.')
    : null;
  const error = saveError ?? loadError;

  const updateChannel = (
    notificationTypeKey: string,
    channel: NotificationChannel,
    state: NotificationExplicitPreferenceState,
  ) => {
    if (!runtime) return;
    updateSubscription.mutate(
      { notificationTypeKey, channel, state },
      {
        onSuccess: () =>
          appToast.success(
            t('profile.notificationSettingsSaved', undefined, 'Notification preferences updated.'),
          ),
        onError: (nextError) => {
          const message =
            nextError instanceof Error
              ? nextError.message
              : t('common.genericError', undefined, 'Something went wrong.');
          appToast.error(message);
        },
      },
    );
  };

  const modules = settingsQuery.data?.modules ?? [];

  if (!ready) {
    return (
      <SettingsSection title="Notification preferences">
        <p className="text-sm text-muted-foreground">{t('common.loading', undefined, 'Loading')}</p>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title={t('profile.notificationsTitle', undefined, 'Notification preferences')}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading', undefined, 'Loading')}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!isLoading && modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t(
            'profile.notificationsEmpty',
            undefined,
            'No configurable notifications are available for your current modules and permissions yet.',
          )}
        </p>
      ) : null}

      {modules.map((moduleItem) => (
        <div
          key={moduleItem.moduleId}
          className="space-y-3 border-t border-border/50 pt-4 first:border-t-0 first:pt-0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{moduleItem.moduleName}</p>
            <Badge variant={moduleItem.enabled ? 'secondary' : 'outline'}>
              {moduleItem.enabled
                ? t('common.enabled', undefined, 'Enabled')
                : t('common.disabled', undefined, 'Disabled')}
            </Badge>
          </div>
          {moduleItem.categories.map((category) => (
            <div key={category.key} className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {category.label}
              </p>
              {category.types.map((typeItem) => (
                <SettingsRow
                  key={typeItem.key}
                  label={typeItem.title}
                  description={typeItem.description}
                  layout="stacked"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {typeItem.channels.map((channel) => {
                      const controlKey = `${typeItem.key}:${channel.channel}`;
                      const label = channelLabel(t, channel.channel);
                      return (
                        <label
                          key={controlKey}
                          className={cn(
                            'grid gap-1 rounded-md border border-border/60 bg-muted/20 p-2',
                            !channel.allowed && 'opacity-60',
                          )}
                        >
                          <span className="text-xs font-medium text-foreground">{label}</span>
                          <select
                            aria-label={`${label} notifications for ${typeItem.title}`}
                            className="h-9 rounded-control border border-border bg-background px-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            value={channel.explicitState}
                            disabled={!channel.allowed || savingKey === controlKey}
                            onChange={(event) =>
                              updateChannel(
                                typeItem.key,
                                channel.channel,
                                event.target.value as NotificationExplicitPreferenceState,
                              )
                            }
                          >
                            {availableStates(channel).map((state) => (
                              <option key={state} value={state}>
                                {state === 'inherited'
                                  ? t(
                                      'profile.notificationStateInheritedWithDefault',
                                      { state: stateLabel(t, channel.defaultState) },
                                      `Default: ${stateLabel(t, channel.defaultState)}`,
                                    )
                                  : stateLabel(t, state)}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-muted-foreground">
                            {channel.allowed
                              ? t(
                                  'profile.notificationCurrentState',
                                  { state: stateLabel(t, channel.effectiveState) },
                                  `Current: ${stateLabel(t, channel.effectiveState)}`,
                                )
                              : (channel.disabledReason ??
                                t('common.disabled', undefined, 'Disabled'))}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </SettingsRow>
              ))}
            </div>
          ))}
        </div>
      ))}
    </SettingsSection>
  );
}
