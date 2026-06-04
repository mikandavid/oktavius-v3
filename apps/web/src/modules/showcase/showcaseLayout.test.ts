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
});
