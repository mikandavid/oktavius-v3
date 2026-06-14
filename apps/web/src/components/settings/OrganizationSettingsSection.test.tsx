import type * as BaseUi from '@oktavius/base-ui';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import { createDefaultOsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { OrganizationSettingsSection } from './OrganizationSettingsSection';

// Decouple from UserPreferencesProvider (useCountryOptions reads the locale).
vi.mock('@/lib/reference-data', () => ({
  useCountryOptions: () => [
    { value: 'AT', label: 'Austria' },
    { value: 'DE', label: 'Germany' },
  ],
  normalizeCountryCode: (value: string) => value || undefined,
}));

vi.mock('@oktavius/base-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof BaseUi>();
  return {
    ...actual,
    SettingsSection: ({
      title,
      description,
      children,
      className,
    }: {
      title: string;
      description?: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <section className={className} data-testid="settings-section" data-title={title}>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
        {children}
      </section>
    ),
    SettingsRow: ({
      label,
      description,
      children,
      className,
      layout,
    }: {
      label: string;
      description?: string;
      children: React.ReactNode;
      className?: string;
      layout?: 'inline' | 'stacked';
    }) => (
      <div
        className={className}
        data-layout={layout ?? 'inline'}
        data-label={label}
        data-testid="settings-row"
      >
        <span>{label}</span>
        {description ? <small>{description}</small> : null}
        {children}
      </div>
    ),
  };
});

function renderOrganizationSettingsSection() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const settings = createDefaultOsirisWorkspaceSettings();

  act(() => {
    root.render(
      <TestI18nProvider>
        <OrganizationSettingsSection
          settings={settings}
          saving={false}
          savedAt={null}
          onChange={vi.fn()}
        />
      </TestI18nProvider>,
    );
  });

  return { container, root };
}

describe('OrganizationSettingsSection', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('composes organization settings from base settings primitives', () => {
    const rendered = renderOrganizationSettingsSection();
    roots.push(rendered.root);

    const sections = [...rendered.container.querySelectorAll('[data-testid="settings-section"]')];
    const rows = [...rendered.container.querySelectorAll('[data-testid="settings-row"]')];
    const rowLabels = rows.map((row) => row.getAttribute('data-label'));

    expect(sections.map((section) => section.getAttribute('data-title'))).toEqual([
      'Company Information',
      'Tax & Registry',
      'Contact',
      'Bank Details',
      'Invoice Settings',
    ]);
    // Packed rows collapse related fields onto one row.
    expect(rowLabels).toContain('Legal Name');
    expect(rowLabels).toContain('Address');
    expect(rowLabels).toContain('Postal code & city');
    expect(rowLabels).toContain('Bank');
    expect(rowLabels).toContain('Payment Terms (days)');
    // Per-field labels that became captions are no longer row labels.
    expect(rowLabels).not.toContain('Bank Name');
    expect(rowLabels).not.toContain('Account Holder');
    // Captions still render inside the packed rows.
    expect(rendered.container.textContent).toContain('Account Holder');
    expect(rendered.container.textContent).toContain('Street');
    expect(rows.length).toBe(14);
  });
});
