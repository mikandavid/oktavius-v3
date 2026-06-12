# Quality Infrastructure — Design (Block 1 of frontend roadmap)

Date: 2026-06-12
Status: approved (roadmap approved by Hüseyin; this is block 1 of 6)

## Goal

Give the V3 frontend an authoritative, fast "did I break it" signal and mechanical
enforcement of the architecture rules that today only live in docs. This is the
foundation the other roadmap blocks (data layer, module anatomy, tests) build on.

## Scope

1. **Full-workspace verification.** Root `typecheck` and `test` currently only cover
   `@oktavius/web` (+ base-ui for test); `packages/base-ui` and `packages/reference-data`
   are never typechecked, `packages/i18n` tests never run at root.
2. **CI.** No CI exists. Add a GitHub Actions workflow.
3. **ESLint hardening.** No accessibility linting, no import ordering, no mechanical
   module-boundary enforcement.
4. **TS strictness.** Enable `noUncheckedIndexedAccess` + `verbatimModuleSyntax`.

Out of scope: data-layer standardization, module anatomy/codegen, component tests,
Playwright, dependency upgrades (separate roadmap blocks).

## Design

### 1. Workspace verification scripts

- Add `"typecheck": "tsc -p tsconfig.json --noEmit"` to `packages/base-ui` and
  `packages/reference-data` (i18n already has one).
- Root scripts become recursive: `"typecheck": "pnpm -r typecheck"`,
  `"test": "pnpm -r test"` — every package that declares the script runs it;
  new packages are covered automatically.

### 2. CI workflow (`.github/workflows/ci.yml`)

Single job on push/PR (any branch): checkout → pnpm 10 → Node 24 (pnpm cache) →
`pnpm install --frozen-lockfile` → `lint` → `typecheck` → `test` → `build` →
`bundle:check`. Build runs before bundle:check because the budget script reads
`apps/web/dist`. One job keeps it simple; split later if runtime grows.

### 3. ESLint hardening

- **Accessibility:** `eslint-plugin-jsx-a11y` flat recommended config on all `.tsx`
  in `apps/web/src` and `packages/base-ui/src`, severity `error`. Violations found
  during rollout are fixed, not suppressed; individual rules may be downgraded to
  `warn` only with an inline justification comment.
- **Import ordering:** `eslint-plugin-simple-import-sort` (autofixable, no config
  bikeshedding) as `error` workspace-wide. Rollout = one `pnpm lint:fix` pass.
- **Type-only imports:** `@typescript-eslint/consistent-type-imports` as `error`
  (autofix). This also clears most `verbatimModuleSyntax` fallout (see 4).
- **Module boundaries:** new custom rule `no-cross-module-imports` in
  `apps/web/eslint-rules/` (same pattern as the four existing custom rules — no new
  resolver dependencies). Semantics:
  - a file in `apps/web/src/modules/<name>/` may not import from
    `apps/web/src/modules/<other>/` (alias `@/modules/...` or relative);
  - files outside `modules/` may not import from `modules/` at all, except
    `app/` (router/manifest lazy-loads pages) and the nav manifest in `lib/`;
  - exemption: `modules/showcase/**` may import other modules — it is the dev-only
    catalog whose job is to render everything.
    Existing violations are fixed by lifting shared code to `@/lib`.

### 4. TypeScript strictness (`tsconfig.base.json`)

- `verbatimModuleSyntax: true` — explicit `import type`; fallout auto-fixed via the
  consistent-type-imports lint rule.
- `noUncheckedIndexedAccess: true` — indexed access returns `T | undefined`; fallout
  fixed by hand (guards or non-null assertions where invariants are documented).
  If fallout exceeds what one pass can safely fix, the flag still lands in this block —
  fixes may be parallelized across packages, but the flag is not deferred.

## Risks

- jsx-a11y on 88 base-ui components may surface many findings; mitigated by Radix
  underpinnings (most primitives are already accessible) and per-rule triage.
- `noUncheckedIndexedAccess` fallout volume unknown; mitigated by measuring first and
  fixing per-directory.
- CI has no remote to run against until the repo gets a GitHub remote; the workflow
  is still committed so it activates the moment a remote exists.

## Verification

`pnpm check` green at root (now covering all packages), plus `pnpm build && pnpm
--filter @oktavius/web bundle:check`. Each numbered scope lands as its own commit.
