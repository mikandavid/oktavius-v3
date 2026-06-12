import { RuleTester } from 'eslint';
import { test } from 'vitest';

import rule from './no-cross-module-imports.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

test('no-cross-module-imports', () => {
  ruleTester.run('no-cross-module-imports', rule, {
    valid: [
      {
        code: "import { icons } from '@/lib/icons';",
        filename: '/repo/apps/web/src/modules/email/EmailPage.tsx',
      },
      {
        code: "import { pageIcon } from './shared';",
        filename: '/repo/apps/web/src/modules/email/EmailPage.tsx',
      },
      {
        code: "import { pageIcon } from '@/modules/email/shared';",
        filename: '/repo/apps/web/src/modules/email/components/Composer.tsx',
      },
      {
        code: "const page = await import('@/lib/appNavModules');",
        filename: '/repo/apps/web/src/modules/email/EmailPage.tsx',
      },
    ],
    invalid: [
      {
        code: "import { useCalendarRuntime } from '@/modules/calendar/shared';",
        filename: '/repo/apps/web/src/modules/email/EmailPage.tsx',
        errors: 1,
      },
      {
        code: "import { x } from '../../calendar/shared';",
        filename: '/repo/apps/web/src/modules/email/components/Composer.tsx',
        errors: 1,
      },
      {
        code: "export { x } from '@/modules/calendar/shared';",
        filename: '/repo/apps/web/src/modules/email/index.ts',
        errors: 1,
      },
      {
        code: "import { pageIcon } from '@/modules/email/shared';",
        filename: '/repo/apps/web/src/components/data/CrudTable.tsx',
        errors: 1,
      },
      {
        code: "const m = await import('@/modules/calendar/shared');",
        filename: '/repo/apps/web/src/modules/email/EmailPage.tsx',
        errors: 1,
      },
    ],
  });
});
