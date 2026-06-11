import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOsirisI18nRuntimeAdapter } from './osirisRuntimeAdapter';

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('createOsirisI18nRuntimeAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches translation overrides through the configured Oktavius API base URL', async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ namespaces: { common: { save: 'Speichern' } } }),
    );
    vi.stubGlobal('fetch', fetch);

    const adapter = createOsirisI18nRuntimeAdapter({
      activeOrgId: 'org_1',
      apiBaseUrl: '/v1',
      config: null,
    });

    await expect(adapter.fetchOverrides?.('de', ['common', 'auth'])).resolves.toEqual({
      common: { save: 'Speichern' },
    });

    expect(fetch).toHaveBeenCalledWith(
      '/v1/i18n/translations/batch?language=de&namespaces=common%2Cauth',
      { credentials: 'include' },
    );
  });

  it('persists language through the configured Oktavius API base URL', async () => {
    const fetch = vi.fn(async () => jsonResponse({ success: true, language: 'de' }));
    vi.stubGlobal('fetch', fetch);

    const adapter = createOsirisI18nRuntimeAdapter({
      activeOrgId: 'org_1',
      apiBaseUrl: '/v1',
      config: null,
    });

    await adapter.persistLanguage?.('de');

    expect(fetch).toHaveBeenCalledWith('/v1/i18n/user/language', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'de' }),
    });
  });
});
