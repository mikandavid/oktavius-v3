# Oktavius UI rules

Single source of truth for ERP frontend UI. Tool-agnostic.

## Read order

1. **[`ui-system.md`](./ui-system.md)** — always apply (stack, shells, bans, UX limits, lint)
2. **[`patterns.md`](./patterns.md)** — task-specific recipes (lists, forms, detail, dialogs, …)
3. **[`foundation.md`](./foundation.md)** — hierarchy, tokens, control states (when tuning look & feel)
4. **[`component-registry.md`](./component-registry.md)** — component catalog + imports

**Domains** (only when working in that area):

| File                                                 | Area                     |
| ---------------------------------------------------- | ------------------------ |
| [`agent-components.md`](./agent-components.md)       | Agent chat, cards, shell |
| [`calendar-components.md`](./calendar-components.md) | Calendar / planner       |
| [`maps-components.md`](./maps-components.md)         | Maps embed               |
| [`email-module.md`](./email-module.md)               | Email workbench          |
| [`locked-components.md`](./locked-components.md)     | Locked base-ui wrappers  |

**Backlog:** [`gaps.md`](./gaps.md) — codegen / backend parity (not day-to-day UI rules).

## Path quick lookup

| You are editing                       | Read                                     |
| ------------------------------------- | ---------------------------------------- |
| Any `apps/web` UI                     | `ui-system.md`                           |
| `modules/**` list/detail/form         | `patterns.md` + `module-pattern` section |
| `components/data/**`                  | `patterns.md` § Lists                    |
| `components/forms/**`                 | `patterns.md` § Forms                    |
| `components/agent/**`                 | `agent-components.md`                    |
| `lib/design-tokens/**` or `/showcase` | `foundation.md` § Tokens                 |
| Picking a component                   | `component-registry.md`                  |

## Maintenance

1. Edit the canonical file above — not duplicate prose elsewhere.
2. Legacy filenames (`page-header.md`, `hierarchy-system.md`, …) are **redirect stubs** only.
3. Mirror critical bans to `.cursor/rules/ui-system.mdc` when they must load in every session.
4. Prefer ESLint in `apps/web/eslint.config.js` for enforceable limits.
