import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type UserPreferencesPatch,
  UserPreferencesProvider,
  useUserPreferences,
} from './userPreferences';

function LocaleProbe() {
  const { locale } = useUserPreferences();
  return <div data-testid="locale">{locale}</div>;
}

function HydrationProbe() {
  const { hydratePreferences, locale, moduleOrderPreference, sidebarCollapsedPreference, theme } =
    useUserPreferences() as ReturnType<typeof useUserPreferences> & {
      hydratePreferences?: (
        snapshot: {
          locale?: 'de' | 'en';
          theme?: 'light' | 'dark' | 'system';
          sidebarCollapsed?: boolean;
          moduleOrder?: string[];
        },
        sourceKey: string,
      ) => void;
    };

  return (
    <div>
      <div data-testid="has-hydrator">{String(typeof hydratePreferences === 'function')}</div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="sidebar-collapsed">{String(sidebarCollapsedPreference)}</div>
      <div data-testid="module-order">{moduleOrderPreference.join(',')}</div>
      <button
        type="button"
        onClick={() =>
          hydratePreferences?.(
            {
              locale: 'de',
              theme: 'dark',
              sidebarCollapsed: true,
              moduleOrder: ['reports', 'clients'],
            },
            'runtime:org_1',
          )
        }
      >
        Hydrate
      </button>
    </div>
  );
}

function ThemeRuntimeProbe({
  updatePreferences,
}: {
  updatePreferences: (patch: UserPreferencesPatch) => Promise<void>;
}) {
  const { setPreferencesRuntime, setTheme, theme } = useUserPreferences() as ReturnType<
    typeof useUserPreferences
  > & {
    setPreferencesRuntime: (
      runtime: {
        updatePreferences: (patch: UserPreferencesPatch) => Promise<void>;
      } | null,
    ) => void;
  };

  useEffect(() => {
    setPreferencesRuntime({ updatePreferences });
    return () => setPreferencesRuntime(null);
  }, [setPreferencesRuntime, updatePreferences]);

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button type="button" onClick={() => setTheme('dark')}>
        Set dark
      </button>
    </div>
  );
}

function ShellPreferencesRuntimeProbe({
  updatePreferences,
}: {
  updatePreferences: (patch: UserPreferencesPatch) => Promise<void>;
}) {
  const {
    moduleOrderPreference,
    setModuleOrderPreference,
    setPreferencesRuntime,
    setSidebarCollapsedPreference,
    sidebarCollapsedPreference,
  } = useUserPreferences();

  useEffect(() => {
    setPreferencesRuntime({ updatePreferences });
    return () => setPreferencesRuntime(null);
  }, [setPreferencesRuntime, updatePreferences]);

  return (
    <div>
      <div data-testid="sidebar-collapsed">{String(sidebarCollapsedPreference)}</div>
      <div data-testid="module-order">{moduleOrderPreference.join(',')}</div>
      <button type="button" onClick={() => setSidebarCollapsedPreference(true)}>
        Compact sidebar
      </button>
      <button type="button" onClick={() => setModuleOrderPreference(['reports', 'clients'])}>
        Reorder modules
      </button>
    </div>
  );
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

function renderHydrationProbe() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <UserPreferencesProvider>
        <HydrationProbe />
      </UserPreferencesProvider>,
    );
  });

  return { container, root };
}

function renderThemeRuntimeProbe(
  updatePreferences: (patch: UserPreferencesPatch) => Promise<void>,
) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <UserPreferencesProvider>
        <ThemeRuntimeProbe updatePreferences={updatePreferences} />
      </UserPreferencesProvider>,
    );
  });

  return { container, root };
}

function renderShellPreferencesRuntimeProbe(
  updatePreferences: (patch: UserPreferencesPatch) => Promise<void>,
) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <UserPreferencesProvider>
        <ShellPreferencesRuntimeProbe updatePreferences={updatePreferences} />
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

  it('hydrates locale and theme from a backend preference snapshot', () => {
    const rendered = renderHydrationProbe();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="has-hydrator"]')?.textContent).toBe(
      'true',
    );

    act(() => {
      rendered.container
        .querySelector('button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.querySelector('[data-testid="locale"]')?.textContent).toBe('de');
    expect(rendered.container.querySelector('[data-testid="theme"]')?.textContent).toBe('dark');
    expect(rendered.container.querySelector('[data-testid="sidebar-collapsed"]')?.textContent).toBe(
      'true',
    );
    expect(rendered.container.querySelector('[data-testid="module-order"]')?.textContent).toBe(
      'reports,clients',
    );
    expect(window.localStorage.getItem('oktavius.ui.locale')).toBe('de');
    expect(window.localStorage.getItem('oktavius.ui.theme')).toBe('dark');
    expect(window.localStorage.getItem('sidebar-collapsed')).toBe('true');
    expect(window.localStorage.getItem('sidebar-modules-order-v1')).toBe(
      JSON.stringify(['reports', 'clients']),
    );
    expect(document.documentElement.lang).toBe('de');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('writes theme changes through the configured backend preference runtime', () => {
    const updatePreferences = vi.fn().mockResolvedValue(undefined);
    const rendered = renderThemeRuntimeProbe(updatePreferences);
    roots.push(rendered.root);

    act(() => {
      rendered.container
        .querySelector('button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.querySelector('[data-testid="theme"]')?.textContent).toBe('dark');
    expect(window.localStorage.getItem('oktavius.ui.theme')).toBe('dark');
    expect(updatePreferences).toHaveBeenCalledWith({ uiSettings: { theme: 'dark' } });
  });

  it('writes shell preference changes through the configured backend preference runtime', () => {
    const updatePreferences = vi.fn().mockResolvedValue(undefined);
    const rendered = renderShellPreferencesRuntimeProbe(updatePreferences);
    roots.push(rendered.root);

    act(() => {
      rendered.container
        .querySelectorAll('button')[0]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    act(() => {
      rendered.container
        .querySelectorAll('button')[1]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.querySelector('[data-testid="sidebar-collapsed"]')?.textContent).toBe(
      'true',
    );
    expect(rendered.container.querySelector('[data-testid="module-order"]')?.textContent).toBe(
      'reports,clients',
    );
    expect(updatePreferences).toHaveBeenNthCalledWith(1, {
      uiSettings: { sidebarCollapsed: true },
    });
    expect(updatePreferences).toHaveBeenNthCalledWith(2, {
      uiSettings: { moduleOrder: ['reports', 'clients'] },
    });
  });
});
