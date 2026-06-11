import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('public auth routes', () => {
  it('declares auth routes outside the protected app layout', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/router.tsx'), 'utf8');
    const gateIndex = source.indexOf('<OsirisAccessGate>');

    for (const routePath of [
      "path: '/login'",
      "path: '/forgot-password'",
      "path: '/reset-password'",
      "path: '/signup'",
      "path: '/auth/callback'",
      "path: '/invite/:token'",
    ]) {
      const routeIndex = source.indexOf(routePath);
      expect(routeIndex, `${routePath} should be present`).toBeGreaterThanOrEqual(0);
      expect(routeIndex, `${routePath} should be public`).toBeLessThan(gateIndex);
    }
  });
});
