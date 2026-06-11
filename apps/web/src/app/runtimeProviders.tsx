import { useEffect, useMemo, type ReactNode } from 'react';

import { ApiProvider } from '@/api/ApiProvider';
import { createOsirisApiRegistry } from '@/api/apiRegistryConfig';
import { I18nProvider } from '@/core/i18n';
import { useOsirisI18nRuntime } from '@/core/i18n/osirisRuntimeAdapter';
import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import {
  UserPreferencesProvider,
  useUserPreferences,
  type UserPreferenceSnapshot,
} from '@/lib/userPreferences';
import { OsirisAuthProvider } from '@/runtime/osiris/AuthProvider';
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { AgentChatProvider } from './agent-chat-data';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readLocale(value: unknown): UserPreferenceSnapshot['locale'] {
  return value === 'de' || value === 'en' ? value : null;
}

function readTheme(value: unknown): UserPreferenceSnapshot['theme'] {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readStringArray(value: unknown): string[] | null {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : null;
}

function readRecordKey(record: Record<string, unknown>, key: string): Record<string, unknown> {
  return isRecord(record[key]) ? record[key] : {};
}

type RuntimePreferenceSource = Pick<ReturnType<typeof useOsirisRuntime>, 'config' | 'currentUser'>;

export function buildUserPreferenceSnapshot(
  runtime: RuntimePreferenceSource,
): UserPreferenceSnapshot {
  const preferences = isRecord(runtime.config?.preferences) ? runtime.config.preferences : {};
  const uiPreferences = readRecordKey(preferences, 'ui');
  const uiSettings = readRecordKey(preferences, 'uiSettings');
  const snakeUiSettings = readRecordKey(preferences, 'ui_settings');

  return {
    locale:
      readLocale(runtime.currentUser.preferredLanguage) ??
      readLocale(uiPreferences.locale) ??
      readLocale(uiSettings.locale) ??
      readLocale(snakeUiSettings.locale) ??
      readLocale(preferences.locale),
    theme:
      readTheme(uiPreferences.theme) ??
      readTheme(uiSettings.theme) ??
      readTheme(snakeUiSettings.theme) ??
      readTheme(preferences.theme),
    sidebarCollapsed:
      readBoolean(uiPreferences.sidebarCollapsed) ??
      readBoolean(uiSettings.sidebarCollapsed) ??
      readBoolean(snakeUiSettings.sidebarCollapsed) ??
      readBoolean(snakeUiSettings.sidebar_collapsed) ??
      readBoolean(preferences.sidebarCollapsed) ??
      readBoolean(preferences.sidebar_collapsed),
    moduleOrder:
      readStringArray(uiPreferences.moduleOrder) ??
      readStringArray(uiSettings.moduleOrder) ??
      readStringArray(snakeUiSettings.moduleOrder) ??
      readStringArray(snakeUiSettings.module_order) ??
      readStringArray(preferences.moduleOrder) ??
      readStringArray(preferences.module_order),
  };
}

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
