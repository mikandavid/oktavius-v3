import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const modulesDir = join(process.cwd(), 'src/modules');

function collectDetailPages(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return collectDetailPages(path);
    return /DetailPage\.tsx$/.test(path) ? [path] : [];
  });
}

describe('detail tab architecture', () => {
  it('keeps installed EntityDetailWorkspaceTabs backed by URL tab state', () => {
    const violations = collectDetailPages(modulesDir).flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      if (!source.includes('EntityDetailWorkspaceTabs')) return [];

      const issues: string[] = [];

      if (!source.includes('useUrlTabState')) {
        issues.push('missing useUrlTabState');
      }
      if (!/activeTab=\{activeTab\}/.test(source)) {
        issues.push('does not pass activeTab from URL state');
      }
      if (!/onTabChange=\{setActiveTab\}/.test(source)) {
        issues.push('does not pass setActiveTab');
      }
      if (/activeTab="[^"]+"/.test(source) || /onTabChange=\{\(\) => undefined\}/.test(source)) {
        issues.push('uses fixed/no-op tab state');
      }

      return issues.map((issue) => `${relative(process.cwd(), path)}: ${issue}`);
    });

    expect(violations).toEqual([]);
  });

  it('keeps installed custom detail Tabs controlled by URL tab state', () => {
    const violations = collectDetailPages(modulesDir).flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      if (!source.includes('<Tabs')) return [];

      const issues: string[] = [];

      if (!source.includes('useUrlTabState')) {
        issues.push('missing useUrlTabState');
      }
      if (!/<Tabs\s+value=\{activeTab\}\s+onValueChange=\{setActiveTab\}/.test(source)) {
        issues.push('does not control Tabs from URL state');
      }
      if (/<Tabs\s+defaultValue=/.test(source)) {
        issues.push('uses defaultValue instead of URL state');
      }

      return issues.map((issue) => `${relative(process.cwd(), path)}: ${issue}`);
    });

    expect(violations).toEqual([]);
  });
});
