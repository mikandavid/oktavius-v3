import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  NotificationChannel,
  NotificationExplicitPreferenceState,
  NotificationSettings,
  NotificationsRuntimeAdapter,
} from '@/components/layout/NotificationsRuntime';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

const EMPTY_SETTINGS: NotificationSettings = { modules: [] };

type OrgId = string | null;

// Scoped by org so switching workspace swaps to a separate cache entry instead
// of letting a slow fetch for the previous org overwrite the new one.
function notificationSettingsKey(orgId: OrgId) {
  return ['notification-settings', orgId] as const;
}

export type UpdateSubscriptionInput = {
  notificationTypeKey: string;
  channel: NotificationChannel;
  state: NotificationExplicitPreferenceState;
};

export function useNotificationSettings(runtime?: NotificationsRuntimeAdapter) {
  const orgId = useOptionalOsirisRuntime()?.activeOrgId ?? null;
  return useQuery({
    queryKey: notificationSettingsKey(orgId),
    queryFn: () => (runtime ? runtime.fetchSettings() : Promise.resolve(EMPTY_SETTINGS)),
    enabled: Boolean(runtime),
  });
}

export function useUpdateNotificationSubscription(runtime?: NotificationsRuntimeAdapter) {
  const orgId = useOptionalOsirisRuntime()?.activeOrgId ?? null;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSubscriptionInput) => {
      if (!runtime) throw new Error('Notifications runtime is unavailable in this environment.');
      return runtime.updateSubscription(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationSettingsKey(orgId) });
    },
  });
}
