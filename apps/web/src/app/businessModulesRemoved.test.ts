import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const businessModules = [
  'cases',
  'clients',
  'contacts',
  'contracts',
  'incidents',
  'invoices',
  'leads',
  'orders',
  'products',
  'projects',
  'purchasing',
  'staff',
  'users',
  'vendors',
] as const;

describe('business CRUD module removal', () => {
  it('does not keep business CRUD module implementation directories installed', () => {
    const remaining = businessModules.filter((moduleId) =>
      existsSync(join(process.cwd(), 'src/modules', moduleId)),
    );

    expect(remaining).toEqual([]);
  });

  it('does not route or navigate to removed business CRUD modules', () => {
    const routerSource = readFileSync(join(process.cwd(), 'src/app/router.tsx'), 'utf8');
    const navSource = readFileSync(join(process.cwd(), 'src/lib/appNavModules.ts'), 'utf8');
    const offenders = businessModules.flatMap((moduleId) => {
      const issues: string[] = [];

      if (routerSource.includes(`@/modules/${moduleId}`)) {
        issues.push(`router imports ${moduleId}`);
      }
      if (routerSource.includes(`path: '/${moduleId}`)) {
        issues.push(`router exposes /${moduleId}`);
      }
      if (navSource.includes(`id: '${moduleId}'`)) {
        issues.push(`nav exposes ${moduleId}`);
      }
      if (navSource.includes(`path: '/${moduleId}'`)) {
        issues.push(`nav links /${moduleId}`);
      }

      return issues;
    });

    expect(offenders).toEqual([]);
  });

  it('keeps a shell-level fallback route for stale removed-module URLs', () => {
    const routerSource = readFileSync(join(process.cwd(), 'src/app/router.tsx'), 'utf8');

    expect(routerSource).toContain("path: '*'");
    expect(routerSource).toContain('AppNotFoundPage');
  });

  it('does not keep visible UI links to removed business CRUD routes', () => {
    const roots = [join(process.cwd(), 'src/modules'), join(process.cwd(), 'src/components/agent')];
    const removedRoutePattern =
      /\/(?:clients|cases|contacts|vendors|leads|staff|purchasing|orders|products|projects|contracts|invoices|incidents|users|catalog|sales|funeral\/cases)(?:\/|['"`])/;

    function collectFiles(dir: string): string[] {
      return readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        const stat = statSync(path);
        if (stat.isDirectory()) return collectFiles(path);
        return /\.(ts|tsx)$/.test(path) ? [path] : [];
      });
    }

    const offenders = roots.flatMap((root) =>
      collectFiles(root)
        .filter((path) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'))
        .filter((path) => removedRoutePattern.test(readFileSync(path, 'utf8')))
        .map((path) => relative(process.cwd(), path)),
    );

    expect(offenders).toEqual([]);
  });
});
