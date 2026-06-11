/**
 * Runtime adapter for i18n side-effects (org/industry overrides, language persistence).
 *
 * Demo runtime: all no-ops. Production runtime: wires to backend `/i18n/*` endpoints.
 * The I18nProvider only calls these — never imports auth/api directly.
 */
import type { LanguageCode } from '@oktavius/i18n';

export interface I18nRuntimeAdapter {
  industryKey?: string | null;
  organizationId?: string | null;
  enabledModuleIds?: readonly string[];
  /** Fetch override translations from backend. Returns map ns -> translations. Empty object if unavailable. */
  fetchOverrides?: (
    language: LanguageCode,
    namespaces: string[],
  ) => Promise<Record<string, Record<string, unknown>>>;
  /** Persist user language preference. Called on setLanguage. */
  persistLanguage?: (language: LanguageCode) => Promise<void> | void;
}

export const NOOP_I18N_RUNTIME: I18nRuntimeAdapter = {
  industryKey: null,
  organizationId: null,
  enabledModuleIds: [],
};
