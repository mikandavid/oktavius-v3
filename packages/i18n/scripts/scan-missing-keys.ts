/**
 * Scans the v3 web app for `t('ns.key')` calls and reports keys missing from
 * locales/de + locales/en. Run via `pnpm --filter @oktavius/i18n scan:missing`.
 *
 * Limitations: only catches static string literal keys. Dynamic keys are skipped.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');
const LOCALES = join(__dirname, '..', 'locales');

const EXTS = new Set(['.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo']);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (EXTS.has(extname(entry))) files.push(full);
  }
  return files;
}

function loadJson(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function hasKey(obj: Record<string, unknown>, dotted: string): boolean {
  const parts = dotted.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return false;
    }
  }
  return cur !== undefined;
}

const T_CALL = /\bt\(\s*['"]([\w.-]+)['"]/g;

const usage = new Map<string, Set<string>>(); // ns -> set of dotted keys
for (const file of walk(WEB_SRC)) {
  const src = readFileSync(file, 'utf-8');
  let m: RegExpExecArray | null;
  while ((m = T_CALL.exec(src))) {
    const key = m[1];
    const dot = key.indexOf('.');
    if (dot <= 0) continue;
    const ns = key.slice(0, dot);
    const inner = key.slice(dot + 1);
    if (!usage.has(ns)) usage.set(ns, new Set());
    usage.get(ns)!.add(inner);
  }
}

const missing: Array<{ lang: 'de' | 'en'; ns: string; key: string }> = [];
for (const [ns, keys] of usage) {
  for (const lang of ['de', 'en'] as const) {
    const path = join(LOCALES, lang, `${ns}.json`);
    const data = loadJson(path);
    for (const k of keys) {
      if (!hasKey(data, k)) missing.push({ lang, ns, key: k });
    }
  }
}

if (missing.length === 0) {
  console.log(`OK — all ${[...usage.values()].reduce((s, k) => s + k.size, 0)} keys present`);
  process.exit(0);
}

for (const { lang, ns, key } of missing) {
  console.log(`MISSING [${lang}] ${ns}.${key}`);
}
console.log(`\n${missing.length} missing entries across ${usage.size} namespace(s)`);
process.exit(1);
