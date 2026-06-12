import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OsirisBootstrapResponse } from './types';
import { OsirisAuthProvider } from './AuthProvider';
import { createDefaultOsirisWorkspaceSettings } from './workspaceSettingsClient';
import { useOsirisRuntime } from './useOsirisRuntime';

const bootstrapOrg1Site1: OsirisBootstrapResponse = {
  user: { id: 'usr_1', email: 'anna@example.test' },
  profile: {
    user_id: 'usr_1',
    email: 'anna@example.test',
    full_name: 'Anna',
    is_super_admin: false,
    active_org_id: 'org_1',
    active_site_id: 'site_1',
  },
  memberships: [
    { org_id: 'org_1', role: 'admin', is_active: true },
    { org_id: 'org_2', role: 'owner', is_active: true },
  ],
  organizations: [
    { id: 'org_1', name: 'Org One', slug: 'one' },
    { id: 'org_2', name: 'Org Two', slug: 'two' },
  ],
  permissions: ['settings.view'],
  locationAccess: {
    activeSiteId: 'site_1',
    accessibleSiteIds: ['site_1', 'site_2'],
    canViewAllSites: true,
    canEditAllSites: false,
    orgSiteCount: 2,
    sites: [
      { id: 'site_1', name: 'Vienna' },
      { id: 'site_2', name: 'Graz' },
    ],
  },
  config: null,
};

const bootstrapOrg1Site2: OsirisBootstrapResponse = {
  ...bootstrapOrg1Site1,
  profile: { ...bootstrapOrg1Site1.profile!, active_site_id: 'site_2' },
  locationAccess: { ...bootstrapOrg1Site1.locationAccess!, activeSiteId: 'site_2' },
};

const bootstrapOrg2: OsirisBootstrapResponse = {
  ...bootstrapOrg1Site1,
  profile: { ...bootstrapOrg1Site1.profile!, active_org_id: 'org_2', active_site_id: null },
  permissions: ['reports.view'],
  locationAccess: {
    activeSiteId: null,
    accessibleSiteIds: null,
    canViewAllSites: true,
    canEditAllSites: true,
    orgSiteCount: 1,
    sites: [{ id: 'site_3', name: 'Linz' }],
  },
};

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function Probe() {
  const runtime = useOsirisRuntime();

  return (
    <div>
      <div data-testid="session">{runtime.sessionStatus ?? 'missing'}</div>
      <div data-testid="error">{runtime.error?.message ?? 'none'}</div>
      <div data-testid="org">{runtime.activeOrgId ?? 'none'}</div>
      <div data-testid="site">{runtime.activeSiteId ?? 'all'}</div>
      <div data-testid="language">{runtime.currentUser.preferredLanguage ?? 'none'}</div>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(runtime.setActiveSiteId?.('site_2')).catch(() => {});
        }}
      >
        Switch site
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(runtime.setActiveOrgId?.('org_2')).catch(() => {});
        }}
      >
        Switch org
      </button>
      <button type="button" onClick={() => void runtime.signOut?.()}>
        Sign out
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(runtime.updateProfile?.({ fullName: 'Anna Beispiel' })).catch(
            () => {},
          );
        }}
      >
        Save profile
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(
            runtime.changePassword?.({
              currentPassword: 'current-password',
              newPassword: 'new-password-123',
            }),
          ).catch(() => {});
        }}
      >
        Change password
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(runtime.loadWorkspaceSettings?.('org_1')).catch(() => {});
        }}
      >
        Load settings
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(
            runtime.updateWorkspaceSettings?.(
              createDefaultOsirisWorkspaceSettings({
                dateTime: {
                  dateFormat: 'YYYY-MM-DD',
                  timeFormat: '24h',
                  timezone: 'Europe/Vienna',
                },
              }),
              'org_1',
            ),
          ).catch(() => {});
        }}
      >
        Save settings
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(runtime.listOrgLocations?.('org_1')).catch(() => {});
        }}
      >
        Load locations
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(
            runtime.updateOrgLocation?.('org_1', 'site_1', { isActive: false }),
          ).catch(() => {});
        }}
      >
        Deactivate location
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(runtime.savedViewsRuntime?.fetchViews({ listKey: 'clients' })).catch(
            () => {},
          );
        }}
      >
        Load saved views
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(runtime.updatePreferredLanguage?.('de')).catch(() => {});
        }}
      >
        Save language
      </button>
    </div>
  );
}

async function renderProvider() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <OsirisAuthProvider>
        <Probe />
      </OsirisAuthProvider>,
    );
  });

  return { container, root };
}

describe('OsirisAuthProvider active context switching', () => {
  let roots: Root[] = [];
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('persists site changes to Osiris and refreshes bootstrap', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site2));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="site"]')?.textContent).toBe('site_1');

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[0]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/me/active-context', {
      body: JSON.stringify({ activeOrgId: 'org_1', activeSiteId: 'site_2' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/v1/bootstrap', { credentials: 'include' });
    expect(rendered.container.querySelector('[data-testid="site"]')?.textContent).toBe('site_2');
  });

  it('persists org changes with a cleared site and refreshes bootstrap', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg2));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[1]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/me/active-context', {
      body: JSON.stringify({ activeOrgId: 'org_2', activeSiteId: null }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/v1/bootstrap', { credentials: 'include' });
    expect(rendered.container.querySelector('[data-testid="org"]')?.textContent).toBe('org_2');
    expect(rendered.container.querySelector('[data-testid="site"]')?.textContent).toBe('all');
  });

  it('marks unauthorized bootstrap responses as anonymous sessions', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 401, statusText: 'Unauthorized' }),
    );

    const rendered = await renderProvider();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="session"]')?.textContent).toBe(
      'anonymous',
    );
    expect(rendered.container.querySelector('[data-testid="error"]')?.textContent).toBe('none');
    expect(rendered.container.querySelector('[data-testid="org"]')?.textContent).toBe('none');
  });

  it('refreshes the backend session once when bootstrap is unauthorized', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, statusText: 'Unauthorized' }))
      .mockResolvedValueOnce(
        jsonResponse({ user: { id: 'usr_1', email: 'anna@example.test' }, expiresAt: 1 }),
      )
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/v1/bootstrap', { credentials: 'include' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/auth/refresh', {
      credentials: 'include',
      method: 'POST',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/v1/bootstrap', { credentials: 'include' });
    expect(rendered.container.querySelector('[data-testid="session"]')?.textContent).toBe(
      'authenticated',
    );
    expect(rendered.container.querySelector('[data-testid="org"]')?.textContent).toBe('org_1');
  });

  it('posts sign-out to Osiris and clears the runtime session', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="session"]')?.textContent).toBe(
      'authenticated',
    );

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[2]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/auth/logout', {
      credentials: 'include',
      method: 'POST',
    });
    expect(rendered.container.querySelector('[data-testid="session"]')?.textContent).toBe(
      'anonymous',
    );
    expect(rendered.container.querySelector('[data-testid="org"]')?.textContent).toBe('none');
  });

  it('updates the signed-in profile and reloads bootstrap', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(jsonResponse({ profile: { full_name: 'Anna Beispiel' } }))
      .mockResolvedValueOnce(
        jsonResponse({
          ...bootstrapOrg1Site1,
          profile: { ...bootstrapOrg1Site1.profile!, full_name: 'Anna Beispiel' },
        }),
      );

    const rendered = await renderProvider();
    roots.push(rendered.root);

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[3]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/me/profile', {
      body: JSON.stringify({ fullName: 'Anna Beispiel' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/v1/bootstrap', { credentials: 'include' });
  });

  it('changes the signed-in password without clearing the runtime session', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[4]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/auth/password/change', {
      body: JSON.stringify({
        currentPassword: 'current-password',
        newPassword: 'new-password-123',
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(rendered.container.querySelector('[data-testid="session"]')?.textContent).toBe(
      'authenticated',
    );
  });

  it('loads and saves workspace settings through the runtime', async () => {
    const settings = createDefaultOsirisWorkspaceSettings({
      dateTime: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h', timezone: 'Europe/Vienna' },
    });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(jsonResponse({ settings }))
      .mockResolvedValueOnce(jsonResponse({ settings }))
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[5]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {
      rendered.container
        .querySelectorAll('button')[6]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/orgs/org_1/settings', {
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/v1/orgs/org_1/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/v1/bootstrap', { credentials: 'include' });
  });

  it('loads and updates organization locations through the runtime', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(
        jsonResponse({
          locations: [{ id: 'site_1', org_id: 'org_1', name: 'Vienna', is_active: true }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          location: { id: 'site_1', org_id: 'org_1', name: 'Vienna', is_active: false },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[7]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {
      rendered.container
        .querySelectorAll('button')[8]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/orgs/org_1/locations', {
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/v1/orgs/org_1/locations/site_1', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/v1/bootstrap', { credentials: 'include' });
  });

  it('exposes saved views persistence through the Osiris runtime', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(
        jsonResponse([{ id: 'custom_1', label: 'Active', filters: { status: 'active' } }]),
      );

    const rendered = await renderProvider();
    roots.push(rendered.root);

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[9]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/generated-stores/saved-views/clients', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('syncs preferred language into the current runtime user after saving it', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(jsonResponse({ success: true, language: 'de' }));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="language"]')?.textContent).toBe('none');

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[10]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/i18n/user/language', {
      body: JSON.stringify({ language: 'de' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
    expect(rendered.container.querySelector('[data-testid="language"]')?.textContent).toBe('de');
  });

  it('expires the runtime session when active context updates are unauthorized', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(bootstrapOrg1Site1))
      .mockResolvedValueOnce(new Response(null, { status: 401, statusText: 'Unauthorized' }));

    const rendered = await renderProvider();
    roots.push(rendered.root);

    await act(async () => {
      rendered.container
        .querySelectorAll('button')[0]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.querySelector('[data-testid="session"]')?.textContent).toBe(
      'expired',
    );
    expect(rendered.container.querySelector('[data-testid="error"]')?.textContent).toBe('none');
  });
});
