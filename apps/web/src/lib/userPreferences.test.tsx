import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserPreferencesProvider, useUserPreferences } from './userPreferences';

function LocaleProbe() {
  const { locale } = useUserPreferences();
  return <div data-testid="locale">{locale}</div>;
}

function renderLocaleProbe() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <UserPreferencesProvider>
        <LocaleProbe />
      </UserPreferencesProvider>,
    );
  });

  return { container, root };
}

describe('UserPreferencesProvider', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('falls back to English for unsupported stored French UI locale', () => {
    window.localStorage.setItem('oktavius.ui.locale', 'fr');

    const rendered = renderLocaleProbe();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="locale"]')?.textContent).toBe('en');
  });
});
