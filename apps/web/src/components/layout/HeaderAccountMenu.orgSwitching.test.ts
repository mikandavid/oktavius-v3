import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('HeaderAccountMenu organization switching wiring', () => {
  it('passes the Osiris organization switcher into the organization menu', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/layout/HeaderAccountMenu.tsx'),
      'utf8',
    );

    expect(source).toContain('setActiveOrgId');
    expect(source).toContain('onSelectOrg');
  });

  it('wires the Osiris sign-out action instead of showing a disabled placeholder', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/layout/HeaderAccountMenu.tsx'),
      'utf8',
    );

    expect(source).toContain('signOut');
    expect(source).not.toContain('Sign out unavailable');
  });
});
