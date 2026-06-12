import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type * as ReactRouterDomModule from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { AuthCallbackPage } from './AuthPlaceholderPage';

const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDomModule>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

const runtime = {
  sessionStatus: 'anonymous',
  currentUser: { id: '', email: null, fullName: null, isSuperadmin: false },
  organizations: [],
  memberships: [],
  activeOrgId: null,
  activeSiteId: null,
  permissions: [],
  permissionSubject: { isSuperadmin: false, role: null, permissions: [] },
  locationAccess: null,
  config: null,
  isLoading: false,
  error: null,
  reload: vi.fn(async () => {}),
  completeProviderSignIn: vi.fn(async () => {}),
} satisfies OsirisRuntimeContextValue;

async function renderCallback(initialPath: string) {
  const container = document.createElement('div');
  document.body.append(container);
  window.history.pushState(null, '', initialPath);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <TestI18nProvider>
          <OsirisRuntimeContext.Provider value={runtime}>
            <AuthCallbackPage />
          </OsirisRuntimeContext.Provider>
        </TestI18nProvider>
      </MemoryRouter>,
    );
  });

  return { container, root };
}

describe('AuthCallbackPage', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    navigate.mockReset();
    runtime.completeProviderSignIn.mockClear();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('completes provider sessions from callback tokens and follows a safe redirect', async () => {
    const rendered = await renderCallback(
      '/auth/callback?redirect=%2Fsettings#access_token=access-token&refresh_token=refresh-token&expires_in=3600&expires_at=1700000000',
    );
    roots.push(rendered.root);

    await act(async () => {
      for (
        let attempt = 0;
        attempt < 30 && runtime.completeProviderSignIn.mock.calls.length === 0;
        attempt += 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    expect(runtime.completeProviderSignIn).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      expiresAt: 1_700_000_000,
    });
    expect(navigate).toHaveBeenCalledWith('/settings', { replace: true });
  });

  it('shows provider errors returned in query parameters', async () => {
    const rendered = await renderCallback(
      '/auth/callback?error=access_denied&error_description=User%20cancelled',
    );
    roots.push(rendered.root);

    await act(async () => {
      for (
        let attempt = 0;
        attempt < 30 && !rendered.container.textContent?.includes('User cancelled');
        attempt += 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    expect(runtime.completeProviderSignIn).not.toHaveBeenCalled();
    expect(rendered.container.textContent).toContain('User cancelled');
  });
});
