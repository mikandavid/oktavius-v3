import type { UserPreferencesPatch, UserPreferencesRuntimeAdapter } from '@/lib/userPreferences';

import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisUserPreferencesRuntimeOptions = {
  baseUrl?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function readErrorMessage(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const payload: unknown = JSON.parse(text);
    if (isRecord(payload)) {
      if (isRecord(payload.error) && typeof payload.error.message === 'string') {
        return payload.error.message;
      }
      if (typeof payload.message === 'string') {
        return payload.message;
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function createOsirisUserPreferencesRuntime(
  options: OsirisUserPreferencesRuntimeOptions = {},
): UserPreferencesRuntimeAdapter {
  return {
    async updatePreferences(patch: UserPreferencesPatch): Promise<void> {
      const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, '/me/preferences'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'User preferences could not be saved.'));
      }
    },
  };
}
