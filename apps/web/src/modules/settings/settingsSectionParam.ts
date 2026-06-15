/** Query-string key used to deep-link a specific settings tab (e.g. `/settings?section=mail`). */
export const SETTINGS_SECTION_PARAM = 'section';

const DEFAULT_SETTINGS_SECTION = 'account';

/**
 * Resolves the settings tab to open from the `?section=` query param. Falls back
 * to the General tab when absent or blank. Membership against the actual section
 * list is validated by SettingsPageFactory, which falls back to the first
 * permitted section for unknown/forbidden ids.
 */
export function resolveInitialSettingsSection(rawSection: string | null): string {
  const trimmed = rawSection?.trim();
  return trimmed ? trimmed : DEFAULT_SETTINGS_SECTION;
}
