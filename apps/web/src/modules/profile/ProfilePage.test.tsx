import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShellLayoutProvider } from '@/components/layout/AppShellLayoutContext';
import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { ProfilePage } from './ProfilePage';

const baseRuntime = {
  sessionStatus: 'authenticated',
  currentUser: {
    id: 'usr_1',
    email: 'anna@example.test',
    fullName: 'Anna',
    isSuperadmin: false,
  },
  organizations: [{ id: 'org_1', name: 'Kunz Bestattung', slug: 'kunz' }],
  memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
  activeOrgId: 'org_1',
  activeSiteId: null,
  permissions: ['org.manage'],
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: ['org.manage'] },
  locationAccess: null,
  config: null,
  isLoading: false,
  error: null,
  reload: vi.fn(async () => {}),
  updateProfile: vi.fn(async () => {}),
  changePassword: vi.fn(async () => {}),
} satisfies OsirisRuntimeContextValue;

async function renderProfile(runtime: OsirisRuntimeContextValue = baseRuntime) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/profile']}>
        <TestI18nProvider>
          <AppShellLayoutProvider>
            <OsirisRuntimeContext.Provider value={runtime}>
              <ProfilePage />
            </OsirisRuntimeContext.Provider>
          </AppShellLayoutProvider>
        </TestI18nProvider>
      </MemoryRouter>,
    );
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

describe('ProfilePage account settings', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    baseRuntime.reload.mockClear();
    baseRuntime.updateProfile.mockClear();
    baseRuntime.changePassword.mockClear();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('saves display name changes through the Osiris runtime', async () => {
    const rendered = await renderProfile();
    roots.push(rendered.root);

    const fullName = rendered.container.querySelector('input[name="fullName"]');
    const form = rendered.container.querySelector('form[data-testid="profile-form"]');

    if (!(fullName instanceof HTMLInputElement)) throw new Error('Expected full name input.');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected profile form.');

    changeInput(fullName, 'Anna Beispiel');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(baseRuntime.updateProfile).toHaveBeenCalledWith({ fullName: 'Anna Beispiel' });
  });

  it('changes passwords through the Osiris runtime after matching confirmation', async () => {
    const rendered = await renderProfile();
    roots.push(rendered.root);

    const currentPassword = rendered.container.querySelector('input[name="currentPassword"]');
    const newPassword = rendered.container.querySelector('input[name="newPassword"]');
    const confirmPassword = rendered.container.querySelector('input[name="confirmPassword"]');
    const form = rendered.container.querySelector('form[data-testid="password-form"]');

    if (!(currentPassword instanceof HTMLInputElement)) {
      throw new Error('Expected current password input.');
    }
    if (!(newPassword instanceof HTMLInputElement)) throw new Error('Expected new password input.');
    if (!(confirmPassword instanceof HTMLInputElement)) {
      throw new Error('Expected confirm password input.');
    }
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected password form.');

    changeInput(currentPassword, 'current-password');
    changeInput(newPassword, 'new-password-123');
    changeInput(confirmPassword, 'new-password-123');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(baseRuntime.changePassword).toHaveBeenCalledWith({
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
    });
  });
});
