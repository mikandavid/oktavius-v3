import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisUserPreferencesRuntime } from './userPreferencesClient';

describe('createOsirisUserPreferencesRuntime', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes user preference patches through the authenticated Osiris endpoint', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ preferences: { uiSettings: { theme: 'dark' } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const runtime = createOsirisUserPreferencesRuntime({ baseUrl: 'https://api.example.test/v1' });

    await runtime.updatePreferences({
      uiSettings: { theme: 'dark', sidebarCollapsed: true, moduleOrder: ['clients', 'reports'] },
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/me/preferences', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uiSettings: {
          theme: 'dark',
          sidebarCollapsed: true,
          moduleOrder: ['clients', 'reports'],
        },
      }),
    });
  });

  it('surfaces backend validation messages when preference patches fail', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Unsupported preference value.' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const runtime = createOsirisUserPreferencesRuntime({ baseUrl: '/v1' });

    await expect(runtime.updatePreferences({ uiSettings: { theme: 'dark' } })).rejects.toThrow(
      'Unsupported preference value.',
    );
  });
});
