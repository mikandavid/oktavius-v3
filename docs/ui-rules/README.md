# Oktavius v3 — UI rules

Single source of truth for frontend UI conventions. For developers, designers, and coding agents. Tool-agnostic.

**Start here:** [`ui-system.md`](./ui-system.md) → relevant topic file → [`component-registry.md`](./component-registry.md) when picking components.

---

## Core (read first)

| File                                               | Purpose                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| [`ui-system.md`](./ui-system.md)                   | Stack, shells, visual tokens, buttons, app shell — **always apply** |
| [`component-registry.md`](./component-registry.md) | Full component catalog, imports, do/don't table                     |
| [`visual-foundation.md`](./visual-foundation.md)   | Colors, typography, spacing, borders, shadows, radius               |
| [`interactive-states.md`](./interactive-states.md) | Hover, focus, disabled, loading, invalid, valid — control state API |
| [`hierarchy-system.md`](./hierarchy-system.md)     | 6-level visual hierarchy + 6 card content tiers                     |
| [`component-guide.md`](./component-guide.md)       | Decision trees — which component for which need                     |
| [`anti-patterns.md`](./anti-patterns.md)           | Common mistakes with code examples                                  |
| [`agent-contract.md`](./agent-contract.md)         | Hard bans, page templates, pre-submit checklist                     |
| [`ux-principles.md`](./ux-principles.md)           | UX laws applied to this product                                     |

---

## Topic rules (by area)

| File                                                           | When to read                                    |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [`page-header.md`](./page-header.md)                           | Page headers, list/detail titles, actions slot  |
| [`crud-table.md`](./crud-table.md)                             | List tables, column stretch, padding, list CRUD |
| [`filter-toolbar.md`](./filter-toolbar.md)                     | Search + filter row layout                      |
| [`combobox.md`](./combobox.md)                                 | Single-select dropdowns                         |
| [`date-format.md`](./date-format.md)                           | `DD.MM.YYYY` display standard                   |
| [`calendar-components.md`](./calendar-components.md)           | `CalendarView`, events, planner UX              |
| [`split-view-master-detail.md`](./split-view-master-detail.md) | Master-detail layouts                           |
| [`entity-form.md`](./entity-form.md)                           | Create/edit forms                               |
| [`interactive-states.md`](./interactive-states.md)             | Control states (loading, invalid, disabled)     |
| [`module-pattern.md`](./module-pattern.md)                     | ERP module file structure                       |
| [`detail-pages.md`](./detail-pages.md)                         | DetailView vs Tabs, Overview tab                |
| [`section-nav.md`](./section-nav.md)                           | Section nav layout, compact app sidebar         |
| [`status-and-money.md`](./status-and-money.md)                 | StatusBadge, MoneyText                          |
| [`dialogs.md`](./dialogs.md)                                   | Modals and confirms                             |
| [`checklist.md`](./checklist.md)                               | ChecklistSection done-state                     |
| [`agent-components.md`](./agent-components.md)                 | Agent chat messages, result cards, shell        |
| [`maps-components.md`](./maps-components.md)                   | Inline map preview and dialog embed             |

---

## Reference

| File                                                                 | Purpose                                |
| -------------------------------------------------------------------- | -------------------------------------- |
| [`component-blocks.md`](./component-blocks.md)                       | Reusable blocks modules should compose |
| [`missing-components.md`](./missing-components.md)                   | Built vs still missing in the codebase |
| [`../../apps/web/eslint.config.js`](../../apps/web/eslint.config.js) | Lint enforcement (`pnpm lint`)         |

---

## Path-based quick lookup

| Path pattern                                    | Topic files                                              |
| ----------------------------------------------- | -------------------------------------------------------- |
| `apps/web/src/modules/**`                       | `module-pattern.md`, `detail-pages.md`, `page-header.md` |
| `apps/web/src/components/data/**`               | `crud-table.md`, `filter-toolbar.md`                     |
| `apps/web/src/components/forms/**`              | `entity-form.md`, `combobox.md`                          |
| `apps/web/src/components/agent/**`              | `agent-components.md`                                    |
| `apps/web/src/components/maps/**`               | `maps-components.md`                                     |
| `packages/base-ui/src/components/scheduling/**` | `calendar-components.md`                                 |
| Any `apps/web` UI file                          | `ui-system.md` + relevant topic above                    |

---

## Suggested read order

1. `ui-system.md`
2. Topic file for your task (table, form, detail page, …)
3. `component-registry.md` when choosing imports
4. `anti-patterns.md` before inventing a layout
5. `agent-contract.md` pre-submit checklist before finishing

---

## Maintaining these rules

1. Edit the relevant file in this folder only.
2. Update this index when adding or renaming docs.
3. Mirror to `.cursor/rules/*.mdc` if the team uses Cursor auto-rules.
4. Add ESLint rules in `apps/web/eslint.config.js` when something should be machine-enforced.
