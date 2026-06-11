import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { ForgotPasswordPage, ResetPasswordPage } from './AuthPlaceholderPage';

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
  requestPasswordReset: vi.fn(async () => {}),
  updateRecoveryPassword: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
} satisfies OsirisRuntimeContextValue;

async function renderAuthPage(element: React.ReactNode, initialPath: string) {
  const container = document.createElement('div');
  document.body.append(container);
  window.history.pushState(null, '', initialPath);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <TestI18nProvider>
          <OsirisRuntimeContext.Provider value={runtime}>{element}</OsirisRuntimeContext.Provider>
        </TestI18nProvider>
      </MemoryRouter>,
    );
  });
  await act(async () => {
    for (let attempt = 0; attempt < 20 && !container.querySelector('form'); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });

  return { container, root };
}

function changeInput(input: HTMLInputElement, value: string) {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('auth password pages', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    runtime.requestPasswordReset.mockClear();
    runtime.updateRecoveryPassword.mockClear();
    runtime.signOut.mockClear();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('requests a password reset email from the Osiris runtime', async () => {
    const rendered = await renderAuthPage(<ForgotPasswordPage />, '/forgot-password');
    roots.push(rendered.root);

    const email = rendered.container.querySelector('input[name="email"]');
    const form = rendered.container.querySelector('form');
    if (!(email instanceof HTMLInputElement)) throw new Error('Expected email input.');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected reset form.');

    changeInput(email, 'anna@example.test');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(runtime.requestPasswordReset).toHaveBeenCalledWith('anna@example.test');
    expect(rendered.container.textContent).toContain('Prüfen Sie Ihre E-Mail');
  });

  it('updates the password with the recovery access token', async () => {
    const rendered = await renderAuthPage(
      <ResetPasswordPage />,
      '/reset-password#access_token=recovery-token',
    );
    roots.push(rendered.root);

    const password = rendered.container.querySelector('input[name="password"]');
    const confirmPassword = rendered.container.querySelector('input[name="confirmPassword"]');
    const form = rendered.container.querySelector('form');
    if (!(password instanceof HTMLInputElement)) throw new Error('Expected password input.');
    if (!(confirmPassword instanceof HTMLInputElement)) {
      throw new Error('Expected confirm password input.');
    }
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected update form.');

    changeInput(password, 'new-password-123');
    changeInput(confirmPassword, 'new-password-123');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(runtime.updateRecoveryPassword).toHaveBeenCalledWith({
      accessToken: 'recovery-token',
      password: 'new-password-123',
    });
    expect(runtime.signOut).toHaveBeenCalledTimes(1);
    expect(rendered.container.textContent).toContain('Passwort erfolgreich aktualisiert.');
  });
});
