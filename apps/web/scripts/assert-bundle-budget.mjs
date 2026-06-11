import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const BUDGETS = [
  {
    name: 'heavy-feature',
    pattern: /^(xlsx-vendor|rich-text-ui|chart-ui)-[\w-]+\.js$/,
    raw: 460 * 1024,
    gzip: 160 * 1024,
  },
  {
    name: 'vendor',
    pattern: /vendor-[\w-]+\.js$/,
    raw: 520 * 1024,
    gzip: 180 * 1024,
  },
  {
    name: 'entry',
    pattern: /^index-[\w-]+\.js$/,
    raw: 80 * 1024,
    gzip: 30 * 1024,
    required: true,
  },
  {
    name: 'route',
    pattern: /^(?!index-)(?!shell-)[A-Za-z][\w-]*-[\w-]+\.js$/,
    raw: 240 * 1024,
    gzip: 80 * 1024,
  },
];

export async function assertBundleBudget(assetsDir = new URL('../dist/assets/', import.meta.url)) {
  const assetsPath = normalizeAssetsPath(assetsDir);
  const files = await readdir(assetsPath);
  const failures = [];

  for (const budget of BUDGETS) {
    const matchingFiles = files.filter((file) => budget.pattern.test(file));

    if (budget.required && matchingFiles.length !== 1) {
      failures.push(
        `Expected exactly one ${budget.name} chunk, found ${matchingFiles.length}: ${
          matchingFiles.join(', ') || 'none'
        }`,
      );
    }
  }

  for (const file of files) {
    const budget = BUDGETS.find((candidate) => candidate.pattern.test(file));

    if (!budget) {
      continue;
    }

    const filePath = path.join(assetsPath, file);
    const [source, statResult] = await Promise.all([readFile(filePath), stat(filePath)]);
    const rawBytes = statResult.size;
    const gzipBytes = gzipSync(source).byteLength;

    if (rawBytes > budget.raw || gzipBytes > budget.gzip) {
      failures.push(
        [
          `${file} exceeds ${budget.name} budget`,
          `raw: ${formatBytes(rawBytes)} / budget: ${formatBytes(budget.raw)}`,
          `gzip: ${formatBytes(gzipBytes)} / budget: ${formatBytes(budget.gzip)}`,
        ].join('\n'),
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join('\n\n'));
  }
}

if (isCli()) {
  await assertBundleBudget();
  console.log(`Bundle budgets passed for ${path.join('dist', 'assets')}`);
}

function normalizeAssetsPath(assetsDir) {
  if (typeof assetsDir === 'string') {
    return path.resolve(assetsDir);
  }

  return fileURLToPath(assetsDir);
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function isCli() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
