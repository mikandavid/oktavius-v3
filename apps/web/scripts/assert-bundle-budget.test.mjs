import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import { assertBundleBudget } from './assert-bundle-budget.mjs';

const tempDirs = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('assertBundleBudget', () => {
  test('rejects oversized vendor chunks', async () => {
    const assetsDir = await createAssetsDir();
    await writeFile(path.join(assetsDir, 'index-a.js'), 'console.log("entry");');
    await writeFile(path.join(assetsDir, 'react-vendor-a.js'), Buffer.alloc(650 * 1024));

    await expect(assertBundleBudget(assetsDir)).rejects.toThrow(
      'react-vendor-a.js exceeds vendor budget',
    );
  });

  test('allows known heavy lazy chunks within the heavy-feature budget', async () => {
    const assetsDir = await createAssetsDir();
    await writeFile(path.join(assetsDir, 'index-a.js'), 'console.log("entry");');
    await writeFile(path.join(assetsDir, 'xlsx-vendor-a.js'), Buffer.alloc(420 * 1024));

    await expect(assertBundleBudget(assetsDir)).resolves.toBeUndefined();
  });

  test('accepts file URL asset directories without a trailing slash', async () => {
    const assetsDir = await createAssetsDir();
    await writeFile(path.join(assetsDir, 'index-a.js'), 'console.log("entry");');

    await expect(assertBundleBudget(pathToFileURL(assetsDir))).resolves.toBeUndefined();
  });

  test('rejects oversized lowercase route chunks', async () => {
    const assetsDir = await createAssetsDir();
    await writeFile(path.join(assetsDir, 'index-a.js'), 'console.log("entry");');
    await writeFile(path.join(assetsDir, 'settings-a.js'), Buffer.alloc(260 * 1024));

    await expect(assertBundleBudget(assetsDir)).rejects.toThrow(
      'settings-a.js exceeds route budget',
    );
  });
});

async function createAssetsDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'oktavius-bundle-budget-'));
  tempDirs.push(dir);
  return dir;
}
