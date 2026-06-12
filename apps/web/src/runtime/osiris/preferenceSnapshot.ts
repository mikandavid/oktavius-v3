import type { UserPreferenceSnapshot } from '@/lib/userPreferences';

import type { useOsirisRuntime } from './useOsirisRuntime';

/**
 * Adapter normalization: Osiris persists UI preferences in several historical
 * payload shapes (`ui`, `uiSettings`, `ui_settings`, top-level, camel and
 * snake case). This module is the single place that knows about them; the app
 * layer consumes only the canonical UserPreferenceSnapshot.
 */
export type RuntimePreferenceSource = Pick<
  ReturnType<typeof useOsirisRuntime>,
  'config' | 'currentUser'
>;

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
