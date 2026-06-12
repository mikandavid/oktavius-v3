import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { AppShellLayoutProvider } from '@/components/layout/AppShellLayoutContext';

import {
  buildSettingsFactoryNavItems,
  SettingsPageFactory,
  type SettingsSectionConfig,
} from './SettingsPageFactory';

const sections: SettingsSectionConfig[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Workspace defaults.',
    title: 'General settings',
    render: () => <p>General content</p>,
  },
  {
    id: 'catalogs',
    label: 'Catalogs',
    title: 'Catalog settings',
    render: () => <p>Catalog content</p>,
  },
];

describe('SettingsPageFactory', () => {
  it('builds nav items from declarative sections', () => {
    expect(buildSettingsFactoryNavItems(sections)).toEqual([
      { key: 'general', label: 'General', icon: undefined, description: 'Workspace defaults.' },
      { key: 'catalogs', label: 'Catalogs', icon: undefined, description: undefined },
    ]);
  });

  it('renders only the active section inside the settings layout', () => {
    const markup = renderToStaticMarkup(
      <AppShellLayoutProvider>
        <SettingsPageFactory sections={sections} activeKey="catalogs" onActiveKeyChange={vi.fn()} />
      </AppShellLayoutProvider>,
    );

    expect(markup).toContain('Catalog settings');
    expect(markup).toContain('Catalog content');
    expect(markup).not.toContain('General content');
  });
});
