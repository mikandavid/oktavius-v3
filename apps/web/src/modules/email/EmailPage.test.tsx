import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShellLayoutProvider } from '@/components/layout/AppShellLayoutContext';
import { I18nProvider } from '@/core/i18n';
import { UserPreferencesProvider } from '@/lib/userPreferences';

import { EmailPage } from './EmailPage';
import { EMAIL_THREADS_STORAGE_KEY } from './emailStorage';

vi.mock('@/lib/toast', () => ({
  appToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    fromApiError: vi.fn(),
  },
}));

function renderEmailPage() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter>
        <AppShellLayoutProvider>
          <UserPreferencesProvider>
            <I18nProvider>
              <EmailPage />
            </I18nProvider>
          </UserPreferencesProvider>
        </AppShellLayoutProvider>
      </MemoryRouter>,
    );
  });

  return { container, root };
}

function buttonByText(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected ${text} button to render.`);
  }
  return button;
}

async function waitForButtonByText(container: HTMLElement, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      return buttonByText(container, text);
    } catch {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    }
  }

  return buttonByText(container, text);
}

describe('EmailPage empty mailbox', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.removeItem(EMAIL_THREADS_STORAGE_KEY);
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('blocks compose when no mailbox data source is connected', async () => {
    const rendered = renderEmailPage();
    roots.push(rendered.root);
    const composeButton = await waitForButtonByText(rendered.container, 'Compose');

    expect(rendered.container.textContent).toContain('Email data source is not connected.');
    expect(composeButton.disabled).toBe(true);
  });
});
