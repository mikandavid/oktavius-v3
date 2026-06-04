import { readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const assetsDir = new URL('../dist/assets/', import.meta.url);
const MAX_ENTRY_RAW_BYTES = 500 * 1024;
const MAX_ENTRY_GZIP_BYTES = 500 * 1024;

const files = await readdir(assetsDir);
const entryFiles = files.filter((file) => /^index-[\w-]+\.js$/.test(file));

if (entryFiles.length !== 1) {
  throw new Error(
    `Expected one web entry chunk, found ${entryFiles.length}: ${entryFiles.join(', ')}`,
  );
}

const entryFile = entryFiles[0];
const entryPath = new URL(entryFile, assetsDir);
const source = await import('node:fs/promises').then(({ readFile }) => readFile(entryPath));
const gzipBytes = gzipSync(source).byteLength;
const statResult = await stat(entryPath);

if (statResult.size > MAX_ENTRY_RAW_BYTES || gzipBytes > MAX_ENTRY_GZIP_BYTES) {
  throw new Error(
    [
      `${path.join('dist/assets', entryFile)} exceeds entry bundle budget.`,
      `raw: ${formatBytes(statResult.size)} / budget: ${formatBytes(MAX_ENTRY_RAW_BYTES)}`,
      `gzip: ${formatBytes(gzipBytes)} / budget: ${formatBytes(MAX_ENTRY_GZIP_BYTES)}`,
    ].join('\n'),
  );
}

console.log(
  `${path.join('dist/assets', entryFile)} within budget: ${formatBytes(statResult.size)} raw, ${formatBytes(gzipBytes)} gzip`,
);

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}
