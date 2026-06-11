/**
 * Osiris runtime → i18n adapter.
 *
 * Wires the v3 i18n provider to Osiris backend endpoints:
 * - GET /i18n/translations/batch?language=&namespaces=  → org/industry overrides
 * - PUT /i18n/user/language { language }                → persist user preference
 *
 * In demo mode (no OsirisAuthProvider) this hook returns the no-op adapter.
 */
import { useMemo } from 'react';

import { joinOsirisApiBaseUrl, resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { NOOP_I18N_RUNTIME, type I18nRuntimeAdapter } from './runtime';

const OSIRIS_API_BASE_URL = resolveOsirisApiBaseUrl();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === 'string') ? value : null;
}

function readEnabledModuleIds(config: unknown): readonly string[] {
  if (!isRecord(config)) return [];

  const enabledModuleIds = readStringArray(config.enabledModuleIds);
  if (enabledModuleIds) return enabledModuleIds;

  return readStringArray(config.modules) ?? [];
}

export function createOsirisI18nRuntimeAdapter({
  activeOrgId,
  apiBaseUrl,
  config,
}: {
  activeOrgId: string | null;
  apiBaseUrl?: string;
  config: unknown;
}): I18nRuntimeAdapter {
  return {
    organizationId: activeOrgId,
    industryKey: null,
    enabledModuleIds: readEnabledModuleIds(config),
    async fetchOverrides(language, namespaces) {
      if (!activeOrgId) return {};
      try {
        const params = new URLSearchParams({
          language,
          namespaces: namespaces.join(','),
        });
        const response = await fetch(
          joinOsirisApiBaseUrl(apiBaseUrl, `/i18n/translations/batch?${params.toString()}`),
          {
            credentials: 'include',
          },
        );
        if (!response.ok) return {};
        const body = (await response.json()) as {
          namespaces?: Record<string, Record<string, unknown>>;
        };
        return body.namespaces ?? {};
      } catch (error) {
        console.warn('[i18n] fetchOverrides failed', error);
        return {};
      }
    },
    async persistLanguage(language) {
      try {
        await fetch(joinOsirisApiBaseUrl(apiBaseUrl, '/i18n/user/language'), {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language }),
        });
      } catch (error) {
        console.warn('[i18n] persistLanguage failed', error);
      }
    },
  };
}

export function useOsirisI18nRuntime(): I18nRuntimeAdapter {
  const runtime = useOptionalOsirisRuntime();
  const activeOrgId = runtime?.activeOrgId ?? null;

  return useMemo<I18nRuntimeAdapter>(() => {
    if (!runtime) return NOOP_I18N_RUNTIME;
    return createOsirisI18nRuntimeAdapter({
      activeOrgId,
      apiBaseUrl: OSIRIS_API_BASE_URL,
      config: runtime.config,
    });
  }, [runtime, activeOrgId]);
}
