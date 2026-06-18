import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@oktavius/base-ui';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as I18nModule from '@/core/i18n';
import { TestI18nProvider } from '@/core/i18n';
import type * as UserPreferencesModule from '@/lib/userPreferences';

const setTheme = vi.fn();
const setLocale = vi.fn();
const setLanguage = vi.fn();

vi.mock('@/lib/userPreferences', async (importOriginal) => {
  const actual = await importOriginal<typeof UserPreferencesModule>();
  return {
    ...actual,
    useUserPreferences: () => ({
      theme: 'system',
      setTheme,
      themeLabel: 'System',
      locale: 'en',
      setLocale,
      localeLabel: 'English',
    }),
  };
});

vi.mock('@/core/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof I18nModule>();
  return {
    ...actual,
    useI18n: () => ({ setLanguage }),
  };
});

import {
  LanguageMenuSection,
  OrganizationMenuSection,
  ThemeMenuSection,
} from './AccountMenuSections';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

function renderRow(node: React.ReactNode) {
  act(() => {
    root.render(<TestI18nProvider>{node}</TestI18nProvider>);
  });
}

// Submenu sections only render inside an open DropdownMenu; wrap them so the
// submenu trigger row mounts and we can assert its label + active-state hint.
function renderInOpenMenu(node: React.ReactNode) {
  renderRow(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>menu</DropdownMenuTrigger>
      <DropdownMenuContent forceMount>{node}</DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe('ThemeMenuSection', () => {
  it('renders a submenu trigger showing the active theme as hint', () => {
    renderInOpenMenu(<ThemeMenuSection />);
    // The submenu trigger row mounts immediately; its options open on hover.
    expect(document.querySelector('[role="menuitem"]')).not.toBeNull();
    expect(document.body.textContent ?? '').toContain('System');
  });
});

describe('LanguageMenuSection', () => {
  it('renders a submenu trigger showing the active locale as hint', () => {
    renderInOpenMenu(<LanguageMenuSection />);
    expect(document.querySelector('[role="menuitem"]')).not.toBeNull();
    expect(document.body.textContent ?? '').toContain('English');
  });
});

describe('OrganizationMenuSection (single org)', () => {
  it('renders a static, non-interactive row for exactly one organization', () => {
    renderRow(
      <OrganizationMenuSection
        activeOrgId="org_1"
        organizations={[{ id: 'org_1', name: 'Texterous', slug: 'texterous' }]}
        onSelectOrg={() => {}}
      />,
    );
    expect(container.textContent).toContain('Texterous');
    // Static label: no submenu trigger button rendered.
    expect(container.querySelector('button')).toBeNull();
  });
});
