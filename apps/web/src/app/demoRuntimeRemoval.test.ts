import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const sourceRoot = join(process.cwd(), 'src');

const fixtureBoundaryFiles = new Set([
  'src/components/agent/agentDemoCardPayloads.ts',
  'src/components/agent/agentDemoResponses.ts',
  'src/components/demo/demoNotificationsRuntime.ts',
  'src/components/documents/documentPreviewDemoData.ts',
  'src/lib/audit/demoAuditLogs.ts',
  'src/lib/custom-fields/demoDefinitions.ts',
  'src/lib/demo/useEnsureDemoOrg.ts',
  'src/lib/locations/demoLocations.ts',
  'src/lib/pickers/demoBusinessContacts.ts',
  'src/lib/pickers/demoFuneralCases.ts',
  'src/lib/search/providers/demoEntities.ts',
  'src/lib/storage/demoEntityStorage.ts',
  'src/lib/storage/demoGlobalStorage.ts',
  'src/modules/email/demoData.ts',
]);

const requiredProductionFiles = [
  'src/modules/calendar/CalendarPage.tsx',
  'src/modules/calendar/shared.tsx',
  'src/modules/email/EmailPage.tsx',
  'src/components/pickers/BusinessContactPicker.tsx',
  'src/components/pickers/FuneralCasePicker.tsx',
  'src/components/storage/EntityStoragePanel.tsx',
  'src/components/storage/StorageFileLinkPickerDialog.tsx',
  'src/components/audit/AuditTrailPanel.tsx',
  'src/components/agent/agentRuntime.ts',
] as const;

function toSourcePath(path: string) {
  return relative(process.cwd(), path).replace(/\\/g, '/');
}

function isSourceFile(path: string) {
  return path.endsWith('.ts') || path.endsWith('.tsx');
}

function isTestFile(path: string) {
  return /\.(test|spec)\.tsx?$/.test(path);
}

function isExcludedBoundary(path: string) {
  if (isTestFile(path)) return true;
  if (path === 'src/app/demo-data.tsx') return true;
  if (path.startsWith('src/app/demo-data/')) return true;
  if (path === 'src/api/demo-client.ts') return true;
  if (path.startsWith('src/api/demo-handlers/')) return true;
  if (path.startsWith('src/modules/showcase/')) return true;
  return fixtureBoundaryFiles.has(path);
}

function collectProductionFiles(dir = sourceRoot): string[] {
  return readdirSync(dir)
    .flatMap((entry) => {
      const absolutePath = join(dir, entry);
      const stats = statSync(absolutePath);
      if (stats.isDirectory()) return collectProductionFiles(absolutePath);
      const sourcePath = toSourcePath(absolutePath);
      if (!isSourceFile(sourcePath) || isExcludedBoundary(sourcePath)) return [];
      return [sourcePath];
    })
    .sort();
}

const productionFiles = collectProductionFiles();

const forbiddenImports = [
  {
    label: 'demo/sample/fixture import segment',
    pattern: /(?:^|\/)[^/]*(?:demo|sample|fixture)[^/]*(?:\/|$)/i,
  },
  {
    label: 'app demo-data',
    pattern: /(?:^|\/)app\/demo-data(?:\/|$)|(?:^|\/|\.\/|\.\.\/)demo-data(?:\/|$)/,
  },
  {
    label: 'api demo-client',
    pattern: /(?:^|\/)api\/demo-client$|(?:^|\/|\.\/|\.\.\/)demo-client$/,
  },
  { label: 'api demo-handlers', pattern: /(?:^|\/)api\/demo-handlers(?:\/|$)/ },
  { label: 'components demo fixtures', pattern: /(?:^|\/)components\/demo(?:\/|$)/ },
  { label: 'demo fixture directory', pattern: /(?:^|\/)demo(?:\/|$)/ },
  { label: 'demo fixture module', pattern: /(?:^|\/|\.\/|\.\.\/)demo[A-Z][^/]*$/ },
  { label: 'sample fixture module', pattern: /(?:^|\/|\.\/|\.\.\/)sample[A-Z][^/]*$/ },
  {
    label: 'fixture module',
    pattern:
      /(?:^|\/)(?:fixtures?|samples?)(?:\/|$)|(?:^|\/|\.\/|\.\.\/)[^/]*(?:Fixture|fixture)[^/]*$/,
  },
] as const;

const forbiddenSourceTokens = [
  'useDemoData(',
  'useOptionalDemoData(',
  'DemoDataProvider',
  'DemoRuntimeProviders',
  'DemoProtectedRoute',
  'USE_DEMO_RUNTIME',
  'VITE_OKTAVIUS_RUNTIME',
  'DEMO_NOTIFICATIONS_RUNTIME',
  'DEMO_NOTIFICATIONS',
  'useInteractiveCalendarDemo',
  'SAMPLE_CALENDAR_EVENTS',
  'buildDemoAgentFollowUp',
  'DEMO_GLOBAL_STORAGE',
  'DEMO_TOKEN_STATS',
  'demoUserId',
  'ORG_APEX_ID',
  'ORG_DEMO_ID',
  'ORG_KUNZ_ID',
  'org_apex',
  'org_demo',
  'org_kunz',
  'Apex Technologies',
  'Oktavius Demo Org',
  'Bestattung Kunz',
  'Bruckner Consulting',
  'Donau Logistics',
  'KUNZ-',
  'TOP_CLIENTS',
  'demoOptions',
  'REVENUE_DATA',
  'ORDER_STATUS_DATA',
  'PIPELINE_FUNNEL',
  'STACKED_PIPELINE',
  'MULTI_LINE_REVENUE',
  'COMBO_DATA',
  'RADAR_KPIS',
  'REVENUE_DRILLDOWN',
  'ORDER_STATUS_DRILLDOWN',
  'PIPELINE_DRILLDOWN',
  'demoRegistry',
  'demo only',
  'createConfiguredApiRegistry({ demoRegistry',
  'Apex Tech',
  'Northwind',
  'Contoso',
  'Fabrikam',
  'Globex',
] as const;

const forbiddenSourceTokensByFile: Record<string, readonly string[]> = {
  'src/modules/calendar/shared.tsx': ['CALENDAR_SOURCES'],
};

function importedSources(source: string): string[] {
  const imports: string[] = [];
  const importPattern =
    /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(source))) {
    imports.push(match[1] ?? match[2]);
  }
  return imports;
}

describe('demo runtime removal', () => {
  it('recursively scans production source files', () => {
    expect(productionFiles).toEqual(expect.arrayContaining([...requiredProductionFiles]));
    expect(productionFiles).not.toEqual(
      expect.arrayContaining([
        'src/app/demo-data.tsx',
        'src/api/demo-client.ts',
        'src/components/demo/demoNotificationsRuntime.ts',
        'src/modules/showcase/ShowcasePage.tsx',
      ]),
    );
  });

  it.each(productionFiles)('%s does not import demo fixtures or runtime data', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8');
    const imports = importedSources(source);

    for (const imported of imports) {
      for (const forbidden of forbiddenImports) {
        expect(
          forbidden.pattern.test(imported),
          `${file} imports ${forbidden.label}: ${imported}`,
        ).toBe(false);
      }
    }

    for (const token of forbiddenSourceTokens) {
      expect(source, `${file} contains ${token}`).not.toContain(token);
    }

    for (const token of forbiddenSourceTokensByFile[file] ?? []) {
      expect(source, `${file} contains ${token}`).not.toContain(token);
    }
  });

  it('removes the runtime mode switch from app code', () => {
    const runtimeSource = readFileSync(join(process.cwd(), 'src/app/runtimeProviders.tsx'), 'utf8');
    const routerSource = readFileSync(join(process.cwd(), 'src/app/router.tsx'), 'utf8');

    expect(runtimeSource).not.toContain('VITE_OKTAVIUS_RUNTIME');
    expect(routerSource).not.toContain('VITE_OKTAVIUS_RUNTIME');
    expect(runtimeSource).not.toContain('DemoRuntimeProviders');
    expect(routerSource).not.toContain('DemoProtectedRoute');
  });

  it('does not mount demo bootstrap from the production layout', () => {
    const layoutSource = readFileSync(
      join(process.cwd(), 'src/components/layout/AppLayout.tsx'),
      'utf8',
    );

    expect(layoutSource).not.toContain('OrgDemoBootstrap');
  });
});
