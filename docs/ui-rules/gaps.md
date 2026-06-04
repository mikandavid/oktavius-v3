# Platform gaps (not UI rules)

Tracks **backend / codegen parity** — not day-to-day component usage. Catalog of what exists: [`component-registry.md`](./component-registry.md).

## Still open (priority)

1. Production backend permission + list/form contract parity
2. API-backed saved views, catalog options, reports (adapters exist; services TBD)
3. Generated modules: richer inline-edit descriptors, related-records rollout, workflow actions
4. Live agent API (`VITE_OKTAVIUS_AGENT_API_URL`) in production
5. Org switcher + global search beyond demo/command palette

## Done in codebase

Calendar/planning (`CalendarView`), workflow blocks, documents, agent UI shell, maps, pickers — see `/showcase` and live routes.

## Outdated names

| Old                  | Use            |
| -------------------- | -------------- |
| `DataTable`          | `CrudMainView` |
| `MetricCard`         | `StatCard`     |
| `Select` in apps/web | `Combobox`     |
