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
  IdentityPills,
  LanguageMenuRow,
  OrganizationMenuSection,
  ThemeMenuRow,
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

function clickRadio(name: string) {
  const radio = Array.from(container.querySelectorAll('[role="radio"]')).find(
    (el) => el.getAttribute('aria-label') === name,
  );
  if (!radio) {
    throw new Error(`radio not found: ${name}`);
  }
  act(() => {
    (radio as HTMLButtonElement).click();
  });
}

describe('ThemeMenuRow', () => {
  it('renders one radio per theme and calls setTheme on click', () => {
    renderRow(<ThemeMenuRow />);
    expect(container.querySelectorAll('[role="radio"]')).toHaveLength(3);
    clickRadio('Light');
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});

describe('LanguageMenuRow', () => {
  it('renders DE/EN radios and updates both locale and language on click', () => {
    renderRow(<LanguageMenuRow />);
    expect(container.querySelectorAll('[role="radio"]')).toHaveLength(2);
    clickRadio('Deutsch');
    expect(setLocale).toHaveBeenCalledWith('de');
    expect(setLanguage).toHaveBeenCalledWith('de');
  });
});

describe('IdentityPills', () => {
  it('renders org and role pills when both present', () => {
    // eslint-disable-next-line jsx-a11y/aria-role -- `role` is a domain prop on IdentityPills, not an ARIA role.
    renderRow(<IdentityPills orgName="Texterous" role="Owner" />);
    const text = container.textContent ?? '';
    expect(text).toContain('Texterous');
    expect(text).toContain('Owner');
  });

  it('renders nothing when both are absent', () => {
    // eslint-disable-next-line jsx-a11y/aria-role -- `role` is a domain prop on IdentityPills, not an ARIA role.
    renderRow(<IdentityPills orgName={null} role={null} />);
    expect(container.textContent).toBe('');
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
