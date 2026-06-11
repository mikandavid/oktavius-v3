import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('CommandPalette search wiring', () => {
  it('uses runtime entity search and does not import demo entity providers', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/command/CommandPalette.tsx'),
      'utf8',
    );

    expect(source).toContain('createRouteSearchProvider');
    expect(source).toContain('createRuntimeSearchProvider');
    expect(source).toContain('useOptionalOsirisRuntime');
    expect(source).not.toContain('createDemoClientsSearchProvider');
    expect(source).not.toContain('createDemoOrdersSearchProvider');
    expect(source).not.toContain('useOptionalDemoData');
    expect(source).toContain('new AbortController()');
    expect(source).toContain('window.setTimeout');
    expect(source).toContain('controller.abort()');
    expect(source).toContain('groupedResults');
  });
});
