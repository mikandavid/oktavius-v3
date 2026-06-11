#!/usr/bin/env node

/**
 * Translation validator. Enforces generic i18n correctness across all locales.
 *
 * Rules (per docs/superpowers/specs/2026-06-08-i18n-ci-enforcement-design.md):
 *   1. Namespace file parity across required languages
 *   2. Key parity within a namespace across languages
 *   3. Interpolation placeholder parity ({{var}} matches between languages for the same key)
 *   4. Plural pair completeness — when a value uses {{count}}:
 *        `_other` must have a singular partner (`_one` OR the bare base key)
 *   5. Leaf value sanity — strings, numbers, booleans, null. Arrays disallowed
 *   6. Registry drift — every locale namespace must appear in ALL_NAMESPACES + have a lazy loader
 *      for every required non-core language. Codegen staleness also checked
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PKG_ROOT = path.resolve(__dirname, '..');

export const DEFAULT_OPTIONS = {
  pkgRoot: DEFAULT_PKG_ROOT,
  requiredLanguages: ['de', 'en'],
  coreNamespaces: ['common', 'navigation', 'errors', 'validation', 'entities'],
  skipFiles: new Set(['_template.json']),
  checkRegistry: true,
  checkCodegenStaleness: true,
  logger: console,
};

// ----- helpers -----

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, full, out);
    } else {
      out[full] = value;
    }
  }
  return out;
}

function listNamespaces(localesDir, language, skipFiles) {
  const dir = path.join(localesDir, language);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !skipFiles.has(f))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

function loadRaw(localesDir, language, namespace, errors) {
  const filePath = path.join(localesDir, language, `${namespace}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`Invalid JSON in ${language}/${namespace}.json: ${error.message}`);
    return null;
  }
}

function extractPlaceholders(value) {
  if (typeof value !== 'string') return new Set();
  const out = new Set();
  const re = /\{\{(\w+)\}\}/g;
  let m;
  while ((m = re.exec(value))) out.add(m[1]);
  return out;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// ----- rule 5: leaf sanity -----

function validateLeafTypes(language, namespace, obj, errors, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      errors.push(
        `[leaf] ${language}/${namespace}.json key '${full}' is an array — arrays not allowed`,
      );
      continue;
    }
    if (value === null) continue;
    const tag = typeof value;
    if (tag === 'object') {
      validateLeafTypes(language, namespace, value, errors, full);
    } else if (tag !== 'string' && tag !== 'number' && tag !== 'boolean') {
      errors.push(
        `[leaf] ${language}/${namespace}.json key '${full}' has unsupported type '${tag}'`,
      );
    }
  }
}

// ----- rule 4: plural pairs -----

function validatePluralPairs(language, namespace, flatMap, errors) {
  const keys = new Set(Object.keys(flatMap));
  const hasCount = (v) => typeof v === 'string' && /\{\{count\}\}/.test(v);

  for (const key of keys) {
    if (key.endsWith('_one')) {
      if (!hasCount(flatMap[key])) continue;
      const sibling = `${key.slice(0, -4)}_other`;
      if (!keys.has(sibling)) {
        errors.push(`[plural] ${language}/${namespace}.json '${key}' missing pair '${sibling}'`);
      }
    } else if (key.endsWith('_other')) {
      if (!hasCount(flatMap[key])) continue;
      const base = key.slice(0, -6);
      if (!keys.has(`${base}_one`) && !keys.has(base)) {
        errors.push(
          `[plural] ${language}/${namespace}.json '${key}' missing singular pair '${base}_one' or '${base}'`,
        );
      }
    }
  }
}

// ----- rules 1-3 -----

function validateNamespace(localesDir, namespace, requiredLanguages, errors, logger) {
  const flatByLang = {};

  for (const lang of requiredLanguages) {
    const file = path.join(localesDir, lang, `${namespace}.json`);
    if (!fs.existsSync(file)) {
      errors.push(`[missing-file] ${lang}/${namespace}.json`);
      continue;
    }
    const raw = loadRaw(localesDir, lang, namespace, errors);
    if (!raw) continue;
    validateLeafTypes(lang, namespace, raw, errors);
    const flat = flatten(raw);
    flatByLang[lang] = flat;
    validatePluralPairs(lang, namespace, flat, errors);
  }

  if (Object.keys(flatByLang).length < requiredLanguages.length) return;

  const allKeys = new Set();
  for (const flat of Object.values(flatByLang)) {
    for (const k of Object.keys(flat)) allKeys.add(k);
  }

  for (const [lang, flat] of Object.entries(flatByLang)) {
    for (const key of allKeys) {
      if (!(key in flat))
        errors.push(`[missing-key] ${lang}/${namespace}.json missing key '${key}'`);
    }
  }

  for (const key of allKeys) {
    const presentLangs = requiredLanguages.filter((l) => flatByLang[l] && key in flatByLang[l]);
    if (presentLangs.length < 2) continue;
    const reference = extractPlaceholders(flatByLang[presentLangs[0]][key]);
    for (const lang of presentLangs.slice(1)) {
      const got = extractPlaceholders(flatByLang[lang][key]);
      if (!setsEqual(reference, got)) {
        errors.push(
          `[placeholder] ${namespace}.${key} placeholder mismatch: ${presentLangs[0]}={${[...reference].join(',')}} ${lang}={${[...got].join(',')}}`,
        );
      }
    }
  }

  logger.log?.(`${namespace}: ${allKeys.size} keys × ${requiredLanguages.length} langs ok`);
}

// ----- rule 6: registry drift -----

function readGeneratedNamespaces(srcDir, errors) {
  const file = path.join(srcDir, 'generated-namespaces.ts');
  if (!fs.existsSync(file)) {
    errors.push(`[registry] missing ${file} — run codegen`);
    return null;
  }
  const src = fs.readFileSync(file, 'utf8');
  const block = src.match(/export const ALL_NAMESPACES[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) {
    errors.push('[registry] cannot parse ALL_NAMESPACES from generated-namespaces.ts');
    return null;
  }
  return new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

function readLazyLoaderLanguages(srcDir, requiredLanguages, errors) {
  const file = path.join(srcDir, 'translations.ts');
  if (!fs.existsSync(file)) {
    errors.push(`[registry] missing ${file} — run codegen`);
    return null;
  }
  const src = fs.readFileSync(file, 'utf8');
  const map = {};
  for (const lang of requiredLanguages) {
    map[lang] = new Set();
    const re = new RegExp(`\\.\\./locales/${lang}/([\\w-]+)\\.json`, 'g');
    let m;
    while ((m = re.exec(src))) map[lang].add(m[1]);
  }
  return map;
}

function validateRegistry(
  localesDir,
  srcDir,
  requiredLanguages,
  coreNamespaces,
  skipFiles,
  errors,
) {
  const enNamespaces = listNamespaces(localesDir, 'en', skipFiles);
  const declared = readGeneratedNamespaces(srcDir, errors);
  const loaderLangs = readLazyLoaderLanguages(srcDir, requiredLanguages, errors);
  if (!declared || !loaderLangs) return;

  for (const ns of enNamespaces) {
    if (!declared.has(ns)) {
      errors.push(`[registry] '${ns}' present in locales/ but missing from ALL_NAMESPACES`);
    }
  }
  for (const ns of declared) {
    if (!enNamespaces.includes(ns)) {
      errors.push(`[registry] '${ns}' in ALL_NAMESPACES but no locale file`);
    }
  }
  for (const ns of enNamespaces) {
    if (coreNamespaces.includes(ns)) continue;
    for (const lang of requiredLanguages) {
      if (!loaderLangs[lang].has(ns)) {
        errors.push(`[registry] '${ns}' missing lazy loader for language '${lang}'`);
      }
    }
  }
}

function validateCodegenStaleness(pkgRoot, errors) {
  const srcDir = path.join(pkgRoot, 'src');
  const genFile = path.join(srcDir, 'generated-namespaces.ts');
  const trFile = path.join(srcDir, 'translations.ts');
  const before = {
    gen: fs.existsSync(genFile) ? fs.readFileSync(genFile, 'utf8') : '',
    tr: fs.existsSync(trFile) ? fs.readFileSync(trFile, 'utf8') : '',
  };
  try {
    execSync(
      `node --experimental-strip-types ${path.join(pkgRoot, 'scripts', 'generate-namespaces.ts')}`,
      {
        stdio: 'pipe',
        cwd: pkgRoot,
      },
    );
  } catch (error) {
    errors.push(`[registry] codegen failed: ${error.message}`);
    return;
  }
  const after = {
    gen: fs.readFileSync(genFile, 'utf8'),
    tr: fs.readFileSync(trFile, 'utf8'),
  };
  if (before.gen !== after.gen || before.tr !== after.tr) {
    errors.push(
      '[registry] codegen output stale — run `pnpm --filter @oktavius/i18n generate:namespaces` and commit',
    );
  }
}

// ----- entry -----

export function validate(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const localesDir = path.join(opts.pkgRoot, 'locales');
  const srcDir = path.join(opts.pkgRoot, 'src');
  const errors = [];
  const log = (msg) => opts.logger?.log?.(msg);

  log('Translation validation\n');

  const referenceNamespaces = listNamespaces(localesDir, 'en', opts.skipFiles);
  for (const ns of referenceNamespaces) {
    validateNamespace(localesDir, ns, opts.requiredLanguages, errors, opts.logger);
  }

  for (const lang of opts.requiredLanguages.filter((l) => l !== 'en')) {
    for (const ns of listNamespaces(localesDir, lang, opts.skipFiles)) {
      if (!referenceNamespaces.includes(ns)) {
        errors.push(`[missing-file] en/${ns}.json (present in ${lang}/)`);
      }
    }
  }

  if (opts.checkRegistry) {
    validateRegistry(
      localesDir,
      srcDir,
      opts.requiredLanguages,
      opts.coreNamespaces,
      opts.skipFiles,
      errors,
    );
  }
  if (opts.checkCodegenStaleness) {
    validateCodegenStaleness(opts.pkgRoot, errors);
  }

  return errors;
}

function main() {
  const errors = validate();
  if (errors.length === 0) {
    console.log('\nAll translation validations passed.');
    return;
  }
  console.error(`\nTranslation validation failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) main();
