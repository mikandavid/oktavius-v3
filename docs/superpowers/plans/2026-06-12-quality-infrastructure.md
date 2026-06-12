# Quality Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full-workspace verification (typecheck/test all packages), a CI pipeline, hardened ESLint (a11y, import order, module boundaries), and stricter TypeScript.

**Architecture:** All changes are additive config/tooling plus fixing the violations they surface. The module-boundary rule follows the repo's existing custom-ESLint-rule pattern in `apps/web/eslint-rules/`. TS strictness lands last because the lint autofixes (type-only imports) clear most of its fallout first.

**Tech Stack:** pnpm 10 workspace, ESLint 9 flat config, typescript-eslint 8, vitest 2, GitHub Actions.

Spec: `docs/superpowers/specs/2026-06-12-quality-infrastructure-design.md`

---

### Task 1: Workspace verification scripts

**Files:**

- Modify: `packages/base-ui/package.json`
- Modify: `packages/reference-data/package.json`
- Modify: `package.json` (root)

- [ ] **Step 1: Add typecheck scripts to the two packages missing them**

`packages/base-ui/package.json` scripts become:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc -p tsconfig.json --noEmit"
}
```

`packages/reference-data/package.json` gains:

```json
"scripts": {
  "typecheck": "tsc -p tsconfig.json --noEmit"
}
```

- [ ] **Step 2: Make root scripts recursive**

In root `package.json` replace:

```json
"typecheck": "pnpm --filter @oktavius/web typecheck",
"test": "pnpm --filter @oktavius/base-ui test && pnpm --filter @oktavius/web test",
```

with:

```json
"typecheck": "pnpm -r typecheck",
"test": "pnpm -r test",
```

- [ ] **Step 3: Run `pnpm typecheck` at root**

Expected: runs in base-ui, i18n, reference-data, web. base-ui and reference-data have never been typechecked — fix any surfaced errors minimally (missing type-only imports, unused vars). Do not refactor.

- [ ] **Step 4: Run `pnpm test` at root**

Expected: base-ui (10 files), i18n (validate-translations), web (91 files) all pass.

- [ ] **Step 5: Commit**

```bash
git add packages/base-ui/package.json packages/reference-data/package.json package.json
git commit -m "chore: typecheck and test the whole workspace from root"
```

### Task 2: CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  push:
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm --filter @oktavius/web bundle:check
```

- [ ] **Step 2: Validate the YAML parses**

Run: `node -e "const f=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); require('node:util'); console.log('bytes', f.length)" && npx --yes yaml-lint .github/workflows/ci.yml || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('valid yaml')"`
Expected: `valid yaml` (python fallback is fine).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint/typecheck/test/build/bundle pipeline"
```

### Task 3: Import ordering + type-only imports (autofixable)

**Files:**

- Modify: `package.json` (root devDependencies)
- Modify: `eslint.config.js`
- Modify: many files via `pnpm lint:fix` (mechanical)

- [ ] **Step 1: Install plugin**

Run: `pnpm add -w -D eslint-plugin-simple-import-sort`

- [ ] **Step 2: Wire into eslint.config.js**

Add import at top:

```js
import simpleImportSort from 'eslint-plugin-simple-import-sort';
```

In the main `files: ['**/*.{ts,tsx}']` block, add to `plugins`:

```js
'simple-import-sort': simpleImportSort,
```

and to `rules`:

```js
'simple-import-sort/imports': 'error',
'simple-import-sort/exports': 'error',
'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
```

- [ ] **Step 3: Autofix the repo**

Run: `pnpm lint:fix`
Expected: large mechanical diff (import reordering, `import type` conversions), exit 0. If any non-autofixable errors remain, fix them by hand.

- [ ] **Step 4: Verify nothing broke**

Run: `pnpm check`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: enforce import ordering and type-only imports"
```

### Task 4: Accessibility linting (jsx-a11y)

**Files:**

- Modify: `package.json` (root devDependencies)
- Modify: `eslint.config.js`
- Modify: components with violations (apps/web/src, packages/base-ui/src)

- [ ] **Step 1: Install plugin**

Run: `pnpm add -w -D eslint-plugin-jsx-a11y`

- [ ] **Step 2: Add scoped config block**

Import at top of `eslint.config.js`:

```js
import jsxA11y from 'eslint-plugin-jsx-a11y';
```

Add a block after the base block:

```js
{
  files: ['apps/web/src/**/*.tsx', 'packages/base-ui/src/**/*.tsx'],
  plugins: { 'jsx-a11y': jsxA11y },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
},
```

- [ ] **Step 3: Triage violations**

Run: `pnpm lint 2>&1 | grep 'jsx-a11y' | sed 's/.*(jsx-a11y/(jsx-a11y/' | sort | uniq -c | sort -rn`
Fix each violation properly (add labels, roles, key handlers, alt text). A rule may be downgraded to `warn` only with an inline comment in `eslint.config.js` stating why (e.g. Radix renders the interactive semantics).

- [ ] **Step 4: Verify**

Run: `pnpm check`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lint): enforce jsx-a11y accessibility rules"
```

### Task 5: Module boundary rule (no-cross-module-imports)

**Files:**

- Create: `apps/web/eslint-rules/no-cross-module-imports.mjs`
- Create: `apps/web/eslint-rules/no-cross-module-imports.test.mjs`
- Modify: `eslint.config.js`
- Modify: any files with violations (lift shared code to `@/lib`)

- [ ] **Step 1: Write the failing test**

`apps/web/eslint-rules/no-cross-module-imports.test.mjs`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run eslint-rules/no-cross-module-imports.test.mjs`
Expected: FAIL — cannot resolve `./no-cross-module-imports.mjs`.

- [ ] **Step 3: Implement the rule**

`apps/web/eslint-rules/no-cross-module-imports.mjs`:

```js
/** @type {import('eslint').Rule.RuleModule} */

import path from 'node:path';

function moduleNameFromPath(filePath) {
  const normalized = filePath.split(path.sep).join('/');
  const match = normalized.match(/\/src\/modules\/([^/]+)/);
  return match ? match[1] : null;
}

function importTargetModule(specifier, filename) {
  if (specifier.startsWith('@/modules/')) {
    const name = specifier.slice('@/modules/'.length).split('/')[0];
    return name || null;
  }
  if (specifier.startsWith('.')) {
    return moduleNameFromPath(path.resolve(path.dirname(filename), specifier));
  }
  return null;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Modules may not import other modules; non-module code may not import modules. Lift shared code to @/lib or @/components.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename;
    const ownModule = moduleNameFromPath(filename);

    function check(node, specifier) {
      if (typeof specifier !== 'string') return;
      const target = importTargetModule(specifier, filename);
      if (!target || target === ownModule) return;
      const message = ownModule
        ? `Module "${ownModule}" must not import from module "${target}". Lift shared code to @/lib or @/components.`
        : `Only app/ and the nav manifest may import from @/modules. Lift shared code to @/lib or @/components.`;
      context.report({ node, message });
    }

    return {
      ImportDeclaration(node) {
        check(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node.source, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node.source, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') check(node.source, node.source.value);
      },
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run eslint-rules/no-cross-module-imports.test.mjs`
Expected: PASS.

- [ ] **Step 5: Wire into eslint.config.js**

Add import:

```js
import noCrossModuleImports from './apps/web/eslint-rules/no-cross-module-imports.mjs';
```

Add to `oktaviusUiPlugin.rules`:

```js
'no-cross-module-imports': noCrossModuleImports,
```

Add config block:

```js
{
  files: ['apps/web/src/**/*.{ts,tsx}'],
  ignores: [
    'apps/web/src/app/**', // router/manifest lazy-load module pages
    'apps/web/src/lib/appNavModules.ts', // nav manifest owns loadPage imports
    'apps/web/src/modules/showcase/**', // dev-only catalog renders everything
  ],
  rules: {
    'oktavius/no-cross-module-imports': 'error',
  },
},
```

- [ ] **Step 6: Fix violations across the repo**

Run: `pnpm lint 2>&1 | grep -B1 'no-cross-module-imports'`
For each violation: move the shared symbol to `apps/web/src/lib/<topic>.ts` (or `components/` if it renders), update both importers. Re-run until clean.

- [ ] **Step 7: Verify and commit**

Run: `pnpm check`
Expected: green.

```bash
git add -A
git commit -m "feat(lint): enforce module boundaries with no-cross-module-imports"
```

### Task 6: verbatimModuleSyntax

**Files:**

- Modify: `tsconfig.base.json`
- Modify: files with remaining type-import fallout

- [ ] **Step 1: Enable the flag**

In `tsconfig.base.json` compilerOptions add:

```json
"verbatimModuleSyntax": true
```

- [ ] **Step 2: Typecheck and fix fallout**

Run: `pnpm typecheck`
Task 3's autofix already converted type-only imports; remaining errors are typically type-only re-exports. Fix pattern:

```ts
// before
export { SomeType } from './types';
// after
export type { SomeType } from './types';
```

- [ ] **Step 3: Verify and commit**

Run: `pnpm check`
Expected: green.

```bash
git add -A
git commit -m "chore(ts): enable verbatimModuleSyntax"
```

### Task 7: noUncheckedIndexedAccess

**Files:**

- Modify: `tsconfig.base.json`
- Modify: files with indexed-access fallout

- [ ] **Step 1: Enable and measure**

In `tsconfig.base.json` compilerOptions add:

```json
"noUncheckedIndexedAccess": true
```

Run: `pnpm typecheck 2>&1 | grep -c "error TS"`
Record the count per package.

- [ ] **Step 2: Fix fallout**

Approved fix patterns, in order of preference:

```ts
// 1. Guard
const first = items[0];
if (!first) return fallback;

// 2. Nullish default
const label = labels[key] ?? '';

// 3. Documented non-null assertion — only when an invariant guarantees presence
// segments.length checked above
const head = segments[0]!;
```

Never blanket-`!` a whole file. If a loop indexes by `i < arr.length`, prefer `for (const item of arr)`.

- [ ] **Step 3: Verify and commit**

Run: `pnpm check && pnpm build && pnpm --filter @oktavius/web bundle:check`
Expected: all green, budgets pass.

```bash
git add -A
git commit -m "chore(ts): enable noUncheckedIndexedAccess"
```

### Task 8: Document the new guardrails

**Files:**

- Modify: `docs/ui-rules/README.md`

- [ ] **Step 1: Add a "mechanically enforced" note**

Append section:

```markdown
## Mechanically enforced

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build, and bundle
budgets on every push. Lint enforces: design tokens, UX limits, import order,
type-only imports, jsx-a11y, and module boundaries (`oktavius/no-cross-module-imports`
— modules may not import other modules; lift shared code to `@/lib`).
```

- [ ] **Step 2: Commit**

```bash
git add docs/ui-rules/README.md
git commit -m "docs: note mechanically enforced guardrails"
```
