import { useEffect, useMemo, type ReactNode } from 'react';

import { ApiProvider } from '@/api/ApiProvider';
import { createOsirisApiRegistry } from '@/api/apiRegistryConfig';
import { I18nProvider } from '@/core/i18n';
import { useOsirisI18nRuntime } from '@/core/i18n/osirisRuntimeAdapter';
import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import { UserPreferencesProvider, useUserPreferences } from '@/lib/userPreferences';
import { OsirisAuthProvider } from '@/runtime/osiris/AuthProvider';
import { buildUserPreferenceSnapshot } from '@/runtime/osiris/preferenceSnapshot';
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { AgentChatProvider } from './agent-chat-data';

function I18nBridge({ children }: { children: ReactNode }) {
  const runtime = useOsirisI18nRuntime();
  return <I18nProvider runtime={runtime}>{children}</I18nProvider>;
}

function UserPreferencesBridge({ children }: { children: ReactNode }) {
  const runtime = useOsirisRuntime();
  const { hydratePreferences, setPreferencesRuntime } = useUserPreferences();
  const snapshot = useMemo(() => buildUserPreferenceSnapshot(runtime), [runtime]);
  const sourceKey = useMemo(
    () =>
      [
        runtime.currentUser.id,
        runtime.activeOrgId ?? 'no-org',
        snapshot.locale ?? 'no-locale',
        snapshot.theme ?? 'no-theme',
        snapshot.sidebarCollapsed == null ? 'no-sidebar' : `sidebar:${snapshot.sidebarCollapsed}`,
        snapshot.moduleOrder?.join(',') ?? 'no-module-order',
      ].join(':'),
    [
      runtime.activeOrgId,
      runtime.currentUser.id,
      snapshot.locale,
      snapshot.theme,
      snapshot.sidebarCollapsed,
      snapshot.moduleOrder,
    ],
  );

  useEffect(() => {
    hydratePreferences(snapshot, sourceKey);
  }, [hydratePreferences, snapshot, sourceKey]);

  useEffect(() => {
    setPreferencesRuntime(runtime.userPreferencesRuntime ?? null);
    return () => setPreferencesRuntime(null);
  }, [runtime.userPreferencesRuntime, setPreferencesRuntime]);

  return <>{children}</>;
}

function OsirisApiProvider({ children }: { children: ReactNode }) {
  const runtime = useOsirisRuntime();
  const { activeOrgId, activeSiteId, expireSession } = runtime;
  const registry = useMemo(
    () =>
      createOsirisApiRegistry({
        env: import.meta.env,
        osiris: {
          getActiveOrgId: () => activeOrgId,
          getActiveSiteId: () => activeSiteId,
          onUnauthorized: () => expireSession?.(),
        },
      }),
    [activeOrgId, activeSiteId, expireSession],
  );

  return <ApiProvider registry={registry}>{children}</ApiProvider>;
}

export function RuntimeProviders({ children }: { children: ReactNode }) {
  return (
    <UserPreferencesProvider>
      <OsirisAuthProvider>
        <UserPreferencesBridge>
          <I18nBridge>
            <OsirisApiProvider>
              <ActiveLocationProvider>
                <AgentChatProvider>{children}</AgentChatProvider>
              </ActiveLocationProvider>
            </OsirisApiProvider>
          </I18nBridge>
        </UserPreferencesBridge>
      </OsirisAuthProvider>
    </UserPreferencesProvider>
  );
}
