import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { AppShellLayoutProvider } from '@/components/layout/AppShellLayoutContext';

import {
  buildSettingsNavItems,
  GeneratedSettingsModule,
  type GeneratedSettingsSection,
} from './GeneratedSettingsModule';

const sections: GeneratedSettingsSection[] = [
  {
    key: 'general',
    label: 'General',
    title: 'General settings',
    description: 'Workspace defaults.',
    render: () => <p>General content</p>,
  },
  {
    key: 'catalogs',
    label: 'Catalogs',
    title: 'Catalog settings',
    render: () => <p>Catalog content</p>,
  },
];

describe('GeneratedSettingsModule', () => {
  it('builds section-nav items from generated settings sections', () => {
    expect(buildSettingsNavItems(sections)).toEqual([
      { key: 'general', label: 'General', icon: undefined, description: 'Workspace defaults.' },
      { key: 'catalogs', label: 'Catalogs', icon: undefined, description: undefined },
    ]);
  });

  it('renders only the active generated settings section', () => {
    const markup = renderToStaticMarkup(
      <AppShellLayoutProvider>
        <GeneratedSettingsModule
          sections={sections}
          activeKey="catalogs"
          onActiveKeyChange={vi.fn()}
        />
      </AppShellLayoutProvider>,
    );

    expect(markup).toContain('Catalog settings');
    expect(markup).toContain('Catalog content');
    expect(markup).not.toContain('General content');
  });
});
