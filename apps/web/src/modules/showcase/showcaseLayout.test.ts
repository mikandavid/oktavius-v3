import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('showcase layout', () => {
  it('constrains the design-token section so its split panes can scroll', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/modules/showcase/ComponentShowcasePage.tsx'),
      'utf8',
    );

    expect(source).toMatch(
      /activeSection === 'design-tokens'\s*\?\s*'flex min-h-0 flex-1 flex-col overflow-hidden'\s*:\s*undefined/,
    );
  });

  it('registers the error-boundary showcase section', () => {
    const shared = readFileSync(join(process.cwd(), 'src/modules/showcase/shared.tsx'), 'utf8');
    const page = readFileSync(
      join(process.cwd(), 'src/modules/showcase/ComponentShowcasePage.tsx'),
      'utf8',
    );

    expect(shared).toContain("key: 'errors'");
    expect(page).toContain("case 'errors':");
    expect(page).toContain('<ErrorsSection />');
  });

  it('demonstrates the field registry extension in the forms showcase', () => {
    const forms = readFileSync(
      join(process.cwd(), 'src/modules/showcase/sections/FormsSection.tsx'),
      'utf8',
    );

    expect(forms).toContain("id: 'customRating'");
    expect(forms).toContain("type: 'customRating'");
    expect(forms).toContain('crossValidate');
  });

  it('demonstrates repeating line items in the forms showcase', () => {
    const forms = readFileSync(
      join(process.cwd(), 'src/modules/showcase/sections/FormsSection.tsx'),
      'utf8',
    );

    expect(forms).toContain("type: 'repeating'");
    expect(forms).toContain('Invoice total');
  });

  it('demonstrates server field-error mapping in the forms showcase', () => {
    const forms = readFileSync(
      join(process.cwd(), 'src/modules/showcase/sections/FormsSection.tsx'),
      'utf8',
    );

    expect(forms).toContain('Simulate server error');
    expect(forms).toContain('withFieldErrors');
    expect(forms).toContain('fieldErrors');
    expect(forms).toContain('formError');
  });

  it('registers the settings factory showcase section', () => {
    const shared = readFileSync(join(process.cwd(), 'src/modules/showcase/shared.tsx'), 'utf8');
    const page = readFileSync(
      join(process.cwd(), 'src/modules/showcase/ComponentShowcasePage.tsx'),
      'utf8',
    );
    const settings = readFileSync(
      join(process.cwd(), 'src/modules/showcase/sections/SettingsSection.tsx'),
      'utf8',
    );

    expect(shared).toContain("key: 'settings'");
    expect(page).toContain("case 'settings':");
    expect(page).toContain('<SettingsShowcaseSection />');
    expect(settings).toContain('CatalogBlockManager<ShowcaseCatalogRow>');
    expect(settings).toContain('Countries');
    expect(settings).toContain('Currencies');
    expect(settings).toContain('Payment terms');
  });

  it('registers and references the responsive detail layout showcase', () => {
    const shared = readFileSync(join(process.cwd(), 'src/modules/showcase/shared.tsx'), 'utf8');
    const page = readFileSync(
      join(process.cwd(), 'src/modules/showcase/ComponentShowcasePage.tsx'),
      'utf8',
    );
    const responsive = readFileSync(
      join(process.cwd(), 'src/modules/showcase/sections/ResponsiveDetailSection.tsx'),
      'utf8',
    );
    const detailLayout = readFileSync(
      join(process.cwd(), 'src/modules/showcase/sections/DetailLayoutSection.tsx'),
      'utf8',
    );

    expect(shared).toContain("key: 'responsive-detail'");
    expect(page).toContain("case 'responsive-detail':");
    expect(page).toContain('<ResponsiveDetailSection />');
    expect(responsive).toContain('ResponsiveDetailLayout');
    expect(detailLayout).toContain('ResponsiveDetailLayout');
  });

  it('documents the multi-source command palette showcase', () => {
    const overview = readFileSync(
      join(process.cwd(), 'src/modules/showcase/sections/OverviewSection.tsx'),
      'utf8',
    );

    expect(overview).toContain('routes, clients, orders');
  });
});
