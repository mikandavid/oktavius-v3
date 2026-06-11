import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { InvitePage, SignUpPage } from './AuthPlaceholderPage';

const inviteToken = '0123456789abcdef0123456789abcdef';

const baseRuntime = {
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
  setActiveOrgId: vi.fn(async () => {}),
  signIn: vi.fn(async () => {}),
  resolveInvitationToken: vi.fn(async () => ({
    kind: 'email_invitation' as const,
    email: 'anna@example.test',
    status: 'pending' as const,
  })),
  acceptInvitation: vi.fn(async () => ({
    kind: 'email_invitation' as const,
    orgId: 'org_123',
    role: 'member' as const,
  })),
  registerInvitation: vi.fn(async () => {}),
} satisfies OsirisRuntimeContextValue;

async function renderAuthRoute(
  element: React.ReactNode,
  initialPath: string,
  runtime: OsirisRuntimeContextValue = baseRuntime,
) {
  const container = document.createElement('div');
  document.body.append(container);
  window.history.pushState(null, '', initialPath);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <TestI18nProvider>
          <OsirisRuntimeContext.Provider value={runtime}>
            <Routes>
              <Route path="/invite/:token" element={element} />
              <Route path="/signup" element={element} />
              <Route path="/dashboard" element={<div data-testid="dashboard" />} />
            </Routes>
          </OsirisRuntimeContext.Provider>
        </TestI18nProvider>
      </MemoryRouter>,
    );
  });

  return { container, root };
}

async function waitForText(container: HTMLElement, text: string) {
  await act(async () => {
    for (let attempt = 0; attempt < 30 && !container.textContent?.includes(text); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
}

function changeInput(input: HTMLInputElement, value: string) {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('auth invitation pages', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    baseRuntime.reload.mockClear();
    baseRuntime.setActiveOrgId?.mockClear();
    baseRuntime.signIn?.mockClear();
    baseRuntime.resolveInvitationToken.mockClear();
    baseRuntime.acceptInvitation.mockClear();
    baseRuntime.registerInvitation.mockClear();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('shows sign-in and invited signup actions for an anonymous email invitation', async () => {
    const rendered = await renderAuthRoute(<InvitePage />, `/invite/${inviteToken}`);
    roots.push(rendered.root);

    await waitForText(rendered.container, 'Einladung annehmen');

    const links = Array.from(rendered.container.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(baseRuntime.resolveInvitationToken).toHaveBeenCalledWith(inviteToken);
    expect(links).toContain(`/login?redirect=${encodeURIComponent(`/invite/${inviteToken}`)}`);
    expect(links).toContain(`/signup?invitedEmail=anna%40example.test&inviteToken=${inviteToken}`);
  });

  it('accepts a matching invitation for an authenticated user', async () => {
    const runtime = {
      ...baseRuntime,
      sessionStatus: 'authenticated',
      currentUser: {
        id: 'user_123',
        email: 'anna@example.test',
        fullName: null,
        isSuperadmin: false,
      },
    } satisfies OsirisRuntimeContextValue;

    const rendered = await renderAuthRoute(<InvitePage />, `/invite/${inviteToken}`, runtime);
    roots.push(rendered.root);

    await act(async () => {
      for (
        let attempt = 0;
        attempt < 30 && baseRuntime.acceptInvitation.mock.calls.length === 0;
        attempt += 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    expect(baseRuntime.acceptInvitation).toHaveBeenCalledWith(inviteToken);
    expect(baseRuntime.setActiveOrgId).toHaveBeenCalledWith('org_123');
    expect(baseRuntime.reload).toHaveBeenCalledTimes(1);
  });

  it('registers an invited user and signs in with the invited email', async () => {
    const rendered = await renderAuthRoute(
      <SignUpPage />,
      `/signup?invitedEmail=anna%40example.test&inviteToken=${inviteToken}`,
    );
    roots.push(rendered.root);

    await waitForText(rendered.container, 'Kontoeinrichtung abschließen');

    const fullName = rendered.container.querySelector('input[name="fullName"]');
    const password = rendered.container.querySelector('input[name="password"]');
    const confirmPassword = rendered.container.querySelector('input[name="confirmPassword"]');
    const form = rendered.container.querySelector('form');
    if (!(fullName instanceof HTMLInputElement)) throw new Error('Expected full name input.');
    if (!(password instanceof HTMLInputElement)) throw new Error('Expected password input.');
    if (!(confirmPassword instanceof HTMLInputElement)) {
      throw new Error('Expected confirm password input.');
    }
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected signup form.');

    changeInput(fullName, 'Anna Beispiel');
    changeInput(password, 'new-password-123');
    changeInput(confirmPassword, 'new-password-123');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(baseRuntime.registerInvitation).toHaveBeenCalledWith({
      token: inviteToken,
      password: 'new-password-123',
      fullName: 'Anna Beispiel',
    });
    expect(baseRuntime.signIn).toHaveBeenCalledWith('anna@example.test', 'new-password-123');
  });
});
