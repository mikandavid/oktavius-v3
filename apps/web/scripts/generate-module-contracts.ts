import { mkdir, writeFile } from 'node:fs/promises';

import { GENERATED_MODULE_TEMPLATE_DESCRIPTORS } from '../src/lib/generatedModuleContracts.ts';
import {
  emitGeneratedModuleFiles,
  materializeGeneratedModuleFiles,
} from '../src/lib/generatedModuleFiles.ts';

type GeneratorCliOptions = {
  rootDir: string;
  dryRun: boolean;
};

function parseArgs(args: string[]): GeneratorCliOptions {
  let rootDir = process.cwd();
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--root') {
      const value = args[index + 1];
      if (!value) throw new Error('--root requires a directory path.');
      rootDir = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { rootDir, dryRun };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = emitGeneratedModuleFiles(GENERATED_MODULE_TEMPLATE_DESCRIPTORS);

  if (options.dryRun) {
    for (const file of files) {
      console.log(file.path);
    }
    console.log(`Generated ${files.length} module contract files. (dry run)`);
    return;
  }

  const result = await materializeGeneratedModuleFiles(files, {
    rootDir: options.rootDir,
    mkdir: (path) => mkdir(path, { recursive: true }).then(() => undefined),
    writeFile,
  });

  for (const path of result.writtenPaths) {
    console.log(path);
  }
  console.log(`Generated ${result.writtenPaths.length} module contract files.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
