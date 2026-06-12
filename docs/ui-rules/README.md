# Oktavius UI rules

Single source of truth for ERP frontend UI. Tool-agnostic.

## Read order

1. **[`ui-system.md`](./ui-system.md)** — always apply (stack, shells, bans, UX limits, lint)
2. **[`patterns.md`](./patterns.md)** — task-specific recipes (lists, forms, detail, dialogs, …)
3. **[`foundation.md`](./foundation.md)** — hierarchy, tokens, control states (when tuning look & feel)
4. **[`component-registry.md`](./component-registry.md)** — component catalog + imports

**Calendar & email** are in [`patterns.md`](./patterns.md#component-library) + [`component-registry.md`](./component-registry.md) — imports from `@oktavius/base-ui` and `@/components/email`.

**Domains** (optional deep dives):

| File                                             | Area                     |
| ------------------------------------------------ | ------------------------ |
| [`agent-components.md`](./agent-components.md)   | Agent chat, cards, shell |
| [`maps-components.md`](./maps-components.md)     | Maps embed               |
| [`locked-components.md`](./locked-components.md) | Locked base-ui wrappers  |

**Backlog:** [`gaps.md`](./gaps.md) — codegen / backend parity (not day-to-day UI rules).

## Path quick lookup

| You are editing                       | Read                                            |
| ------------------------------------- | ----------------------------------------------- |
| Any `apps/web` UI                     | `ui-system.md`                                  |
| `modules/**` list/detail/form         | `patterns.md` + `module-pattern` section        |
| `components/data/**`                  | `patterns.md` § Lists                           |
| `components/forms/**`                 | `patterns.md` § Forms                           |
| `components/agent/**`                 | `agent-components.md`                           |
| `components/email/**`                 | `patterns.md` § Email · `component-registry.md` |
| Calendar / scheduling in modules      | `patterns.md` § Calendar · `@oktavius/base-ui`  |
| `lib/design-tokens/**` or `/showcase` | `foundation.md` § Tokens                        |
| Picking a component                   | `component-registry.md`                         |

## Maintenance

1. Edit the canonical files listed above — do not add parallel topic docs.
2. Mirror critical bans to `.cursor/rules/ui-system.mdc` when they must load in every session.
3. Prefer ESLint in `apps/web/eslint.config.js` for enforceable limits.

## Mechanically enforced

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build, and bundle
budgets on every push. Lint enforces: design tokens, UX limits, import order,
type-only imports, jsx-a11y, and module boundaries (`oktavius/no-cross-module-imports`
— modules may not import other modules; lift shared code to `@/lib`).
