/**
 * Tests for validate-translations. Synthetic locale + src fixtures per case.
 * Run: pnpm --filter @oktavius/i18n test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { validate } from '../validate-translations.mjs';

const SILENT_LOGGER = { log: () => {} };

function makeFixture({ files = {}, generated = null, translations = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-validator-'));
  fs.mkdirSync(path.join(dir, 'locales', 'de'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'locales', 'en'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });

  for (const [relPath, content] of Object.entries(files)) {
    const target = path.join(dir, 'locales', relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content));
  }
  if (generated !== null) {
    fs.writeFileSync(path.join(dir, 'src', 'generated-namespaces.ts'), generated);
  }
  if (translations !== null) {
    fs.writeFileSync(path.join(dir, 'src', 'translations.ts'), translations);
  }
  return dir;
}

const DEFAULT_GEN = (namespaces) => `export const ALL_NAMESPACES = [
${namespaces.map((n) => `  '${n}',`).join('\n')}
];
export const CORE_NAMESPACES = ['common'];
`;

const DEFAULT_TR = (namespaces) => `
${namespaces.map((n) => `() => import('../locales/de/${n}.json');`).join('\n')}
${namespaces.map((n) => `() => import('../locales/en/${n}.json');`).join('\n')}
`;

function runValidate(dir, overrides = {}) {
  return validate({
    pkgRoot: dir,
    requiredLanguages: ['de', 'en'],
    coreNamespaces: ['common'],
    checkRegistry: true,
    checkCodegenStaleness: false,
    logger: SILENT_LOGGER,
    ...overrides,
  });
}

test('valid locales pass', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { save: 'Speichern' },
      'en/common.json': { save: 'Save' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.deepEqual(errors, []);
});

test('missing key in one language fails', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { save: 'Speichern', cancel: 'Abbrechen' },
      'en/common.json': { save: 'Save' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.ok(errors.some((e) => e.includes('[missing-key]') && e.includes('cancel')));
});

test('placeholder mismatch fails', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { greet: 'Hallo {{name}}' },
      'en/common.json': { greet: 'Hello {{user}}' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.ok(errors.some((e) => e.includes('[placeholder]') && e.includes('greet')));
});

test('plural _one without _other fails (with {{count}})', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { items_one: '{{count}} Eintrag' },
      'en/common.json': { items_one: '{{count}} item' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.ok(errors.some((e) => e.includes('[plural]') && e.includes('items_one')));
});

test('plural _other accepts base singular form', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { items: '{{count}} Eintrag', items_other: '{{count}} Einträge' },
      'en/common.json': { items: '{{count}} item', items_other: '{{count}} items' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.deepEqual(
    errors.filter((e) => e.includes('[plural]')),
    [],
  );
});

test('enum-style _other without {{count}} does not trigger plural rule', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { category_other: 'Sonstiges' },
      'en/common.json': { category_other: 'Other' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.deepEqual(errors, []);
});

test('array leaf value fails', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { stages: ['a', 'b'] },
      'en/common.json': { stages: ['a', 'b'] },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.ok(errors.some((e) => e.includes('[leaf]') && e.includes('stages')));
});

test('namespace missing from ALL_NAMESPACES fails', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { save: 'Speichern' },
      'en/common.json': { save: 'Save' },
      'de/bills.json': { x: '1' },
      'en/bills.json': { x: '1' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR(['bills']),
  });
  const errors = runValidate(dir);
  assert.ok(
    errors.some(
      (e) => e.includes('[registry]') && e.includes('bills') && e.includes('ALL_NAMESPACES'),
    ),
  );
});

test('non-core namespace missing lazy loader fails', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { save: 'Speichern' },
      'en/common.json': { save: 'Save' },
      'de/bills.json': { x: '1' },
      'en/bills.json': { x: '1' },
    },
    generated: DEFAULT_GEN(['common', 'bills']),
    translations: `() => import('../locales/de/bills.json');`,
  });
  const errors = runValidate(dir);
  assert.ok(
    errors.some(
      (e) =>
        e.includes('[registry]') &&
        e.includes('bills') &&
        e.includes('lazy loader') &&
        e.includes('en'),
    ),
  );
});

test('missing namespace file in one language fails', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': { save: 'Speichern' },
      'en/common.json': { save: 'Save' },
      'de/extra.json': { foo: 'Bar' },
    },
    generated: DEFAULT_GEN(['common', 'extra']),
    translations: DEFAULT_TR(['extra']),
  });
  const errors = runValidate(dir);
  assert.ok(errors.some((e) => e.includes('[missing-file]') && e.includes('extra')));
});

test('invalid JSON fails', () => {
  const dir = makeFixture({
    files: {
      'de/common.json': '{ bad json',
      'en/common.json': { save: 'Save' },
    },
    generated: DEFAULT_GEN(['common']),
    translations: DEFAULT_TR([]),
  });
  const errors = runValidate(dir);
  assert.ok(errors.some((e) => e.includes('Invalid JSON')));
});
