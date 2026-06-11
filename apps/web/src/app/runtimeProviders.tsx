import { useMemo, type ReactNode } from 'react';

import { ApiProvider } from '@/api/ApiProvider';
import { createOsirisApiRegistry } from '@/api/apiRegistryConfig';
import { I18nProvider } from '@/core/i18n';
import { useOsirisI18nRuntime } from '@/core/i18n/osirisRuntimeAdapter';
import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import { UserPreferencesProvider } from '@/lib/userPreferences';
import { OsirisAuthProvider } from '@/runtime/osiris/AuthProvider';
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { AgentChatProvider } from './agent-chat-data';

function I18nBridge({ children }: { children: ReactNode }) {
  const runtime = useOsirisI18nRuntime();
  return <I18nProvider runtime={runtime}>{children}</I18nProvider>;
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
        <I18nBridge>
          <OsirisApiProvider>
            <ActiveLocationProvider>
              <AgentChatProvider>{children}</AgentChatProvider>
            </ActiveLocationProvider>
          </OsirisApiProvider>
        </I18nBridge>
      </OsirisAuthProvider>
    </UserPreferencesProvider>
  );
}
