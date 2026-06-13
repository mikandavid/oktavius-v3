# Platform gaps (not UI rules)

Tracks **backend / codegen parity** — not day-to-day component usage. Catalog of what exists: [`component-registry.md`](./component-registry.md).

## Still open (priority)

1. Production backend permission + list/form contract parity
2. API-backed saved views and catalog options (adapters exist; services TBD)
3. Generated modules: richer inline-edit descriptors, related-records rollout, workflow actions
4. Live agent API (`VITE_OKTAVIUS_AGENT_API_URL`) in production
5. Org switcher + global search beyond demo/command palette

## Done in codebase

Calendar/planning (`CalendarView`), workflow blocks, documents, agent UI shell, maps, pickers — see `/showcase` and live routes.

2026-06-12 cleanup: demo runtime deleted (app boots Osiris-only; component fixtures remain), API registry trimmed to real resources (`API_RESOURCE_KEYS` in `src/api/contracts.ts`), `APP_NAV_MODULES` is the single source for module routes (loader + access declared per entry), org profiles are preset-driven (`src/lib/org-profiles/presets/`), module codegen lives in `apps/web/tools/module-generator/`.

## Outdated names

| Old                  | Use            |
| -------------------- | -------------- |
| `DataTable`          | `CrudMainView` |
| `MetricCard`         | `StatCard`     |
| `Select` in apps/web | `Combobox`     |
