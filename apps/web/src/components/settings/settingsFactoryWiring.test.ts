import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('settings factory wiring', () => {
  it('uses SettingsPageFactory for the settings module', () => {
    const settingsPage = readFileSync(
      join(process.cwd(), 'src/modules/settings/SettingsPage.tsx'),
      'utf8',
    );

    expect(settingsPage).toContain('SettingsPageFactory');
    expect(settingsPage).toContain("id: 'catalogs'");
  });

  it('keeps CatalogOptionsManager as a thin CatalogBlockManager wrapper', () => {
    const catalogOptionsManager = readFileSync(
      join(process.cwd(), 'src/components/settings/CatalogOptionsManager.tsx'),
      'utf8',
    );

    expect(catalogOptionsManager).toContain('CatalogBlockManager<CatalogOption>');
  });
});
