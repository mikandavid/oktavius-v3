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
      align,
    }: {
      label: string;
      description?: string;
      children: React.ReactNode;
      className?: string;
      layout?: 'inline' | 'stacked';
      align?: 'center' | 'start';
    }) => (
      <div
        className={className}
        data-layout={layout ?? 'inline'}
        data-align={align ?? 'center'}
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

  it('renders every field as its own one-line row, label left / control right', () => {
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

    // Previously-paired fields are now standalone rows.
    expect(rowLabels).toEqual([
      'Legal Name',
      'Street',
      'Address Line 2',
      'Postal Code',
      'City',
      'Country',
      'Tax ID',
      'VAT ID',
      'Registration Number',
      'Email',
      'Phone',
      'Website',
      'Bank Name',
      'Account Holder',
      'IBAN',
      'BIC',
      'Payment Terms (days)',
      'Dunning enabled',
      'Invoice Footer Text',
    ]);

    // The old combined labels are gone.
    expect(rowLabels).not.toContain('Address');
    expect(rowLabels).not.toContain('Postal code & city');
    expect(rowLabels).not.toContain('Tax & VAT ID');
    expect(rowLabels).not.toContain('Email & phone');
    expect(rowLabels).not.toContain('Bank');
  });

  it('keeps multi-line / validated controls aligned to the top, footer stacked', () => {
    const rendered = renderOrganizationSettingsSection();
    roots.push(rendered.root);

    const rowByLabel = (label: string) =>
      rendered.container.querySelector(`[data-testid="settings-row"][data-label="${label}"]`);

    // IBAN/BIC carry a validation message under the input → top-aligned inline.
    expect(rowByLabel('IBAN')?.getAttribute('data-align')).toBe('start');
    expect(rowByLabel('BIC')?.getAttribute('data-align')).toBe('start');
    // The invoice footer textarea stays stacked.
    expect(rowByLabel('Invoice Footer Text')?.getAttribute('data-layout')).toBe('stacked');
    // Simple fields stay inline, centered.
    expect(rowByLabel('Legal Name')?.getAttribute('data-layout')).toBe('inline');
    expect(rowByLabel('Legal Name')?.getAttribute('data-align')).toBe('center');
  });
});
