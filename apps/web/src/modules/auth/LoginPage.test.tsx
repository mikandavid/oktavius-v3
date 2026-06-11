import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { LoginPage } from './LoginPage';

const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
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
  signIn: vi.fn(async () => {}),
  signInWithProvider: vi.fn(async () => {}),
} satisfies OsirisRuntimeContextValue;

async function renderLogin(initialPath = '/login?redirect=%2Freports') {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <TestI18nProvider>
          <OsirisRuntimeContext.Provider value={runtime}>
            <LoginPage />
          </OsirisRuntimeContext.Provider>
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

describe('LoginPage', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    navigate.mockReset();
    runtime.signIn.mockClear();
    runtime.signInWithProvider.mockClear();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('submits credentials through the Osiris runtime and follows the redirect target', async () => {
    const rendered = await renderLogin();
    roots.push(rendered.root);

    const email = rendered.container.querySelector('input[name="email"]');
    const password = rendered.container.querySelector('input[name="password"]');
    const form = rendered.container.querySelector('form');

    if (!(email instanceof HTMLInputElement)) throw new Error('Expected email input.');
    if (!(password instanceof HTMLInputElement)) throw new Error('Expected password input.');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected login form.');

    changeInput(email, 'anna@example.test');
    changeInput(password, 'correct-password');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(runtime.signIn).toHaveBeenCalledWith('anna@example.test', 'correct-password');
    expect(navigate).toHaveBeenCalledWith('/reports', { replace: true });
  });

  it('renders backend login errors without navigating', async () => {
    runtime.signIn.mockRejectedValueOnce(new Error('Invalid email or password.'));
    const rendered = await renderLogin('/login');
    roots.push(rendered.root);

    const email = rendered.container.querySelector('input[name="email"]');
    const password = rendered.container.querySelector('input[name="password"]');
    const form = rendered.container.querySelector('form');

    if (!(email instanceof HTMLInputElement)) throw new Error('Expected email input.');
    if (!(password instanceof HTMLInputElement)) throw new Error('Expected password input.');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected login form.');

    changeInput(email, 'anna@example.test');
    changeInput(password, 'wrong-password');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(rendered.container.textContent).toContain('Invalid email or password.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders provider login options without extra guidance copy', async () => {
    const rendered = await renderLogin('/login');
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('oder weiter mit');
    expect(rendered.container.textContent).toContain('Weiter mit Google');
    expect(rendered.container.textContent).toContain('Weiter mit Microsoft');
    expect(rendered.container.textContent).not.toContain(
      'Benötigen Sie Zugriff? Bitten Sie Ihre Organisationsadministration um eine Einladung.',
    );
  });

  it('starts provider sign-in through the Osiris runtime', async () => {
    const rendered = await renderLogin('/login?redirect=%2Fsettings');
    roots.push(rendered.root);

    const googleButton = Array.from(rendered.container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Weiter mit Google'),
    );
    if (!(googleButton instanceof HTMLButtonElement)) throw new Error('Expected Google button.');

    await act(async () => {
      googleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(runtime.signInWithProvider).toHaveBeenCalledWith('google', '/settings');
  });
});
