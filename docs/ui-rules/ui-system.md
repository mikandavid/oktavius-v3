# Oktavius UI system

Canonical references: [`README.md`](./README.md) (index) and [`component-registry.md`](./component-registry.md). When in doubt, use those — do not invent layouts.

## Stack constraints

- React 19 + Tailwind v3 — semantic tokens only (`text-foreground`, `bg-muted/60`, `rounded-card`)
- Icons: **`@/lib/icons` only** — never `@phosphor-icons/react`
- Data grids: **`CrudMainView` / `CrudTable` only** — never custom `<table>`
- Single-select: **`Combobox` only** in `apps/web` — never `Select`
- Dates in UI: **`formatDisplayDate` / `formatDisplayDateTime`** — `DD.MM.YYYY`
- Currency in UI: **`<MoneyText>`** — no ad-hoc `formatMoney` helpers

## Page shells

| Route type       | Shell                                                   |
| ---------------- | ------------------------------------------------------- |
| List             | `<CrudMainView>` + columns/formFields from `shared.tsx` |
| Create/edit      | `<ModulePage>` + `<EntityForm>`                         |
| Detail (simple)  | `<ModulePage>` + `<DetailView>`                         |
| Detail (complex) | `<ModulePage>` + `<Tabs>` + `<SectionCard>`             |

Every route uses `<ModulePage>`. Never build custom page headers or shells.

**Module icon (required):** pass `icon={modulePageIcon()}` on every `ModulePage` and `CrudMainView`. Use helpers from `@/lib/modulePageIcons` or re-export in module `shared.tsx`. Standard: `size={20} weight="duotone"`, match sidebar nav icon.

## Visual rules (non-negotiable)

- Surfaces: `rounded-card bg-card` — **no borders** on cards, `CrudMainView`, `SplitView` outer
- Inputs: `bg-muted/60` filled style — never `border border-input bg-background`
- Page wash: `bg-muted/40` canvas; modules render white tiles on top
- No `text-gray-*`, `bg-white`, or `rounded-lg` on named surfaces
- No cards-in-cards — use `<SectionCard>` inside pages, not nested `<Card>`

## Button hierarchy

| Context               | Variant                                                       |
| --------------------- | ------------------------------------------------------------- |
| List header “New X”   | `cta` via `PageHeaderCtaLink`                                 |
| Dialog Save / Create  | `cta` via `EntityForm surface="dialog"` or `DialogFormFooter` |
| Full-page form submit | `default`                                                     |
| Delete confirm        | `destructive` on `ConfirmActionDialog` / `AlertDialogAction`  |
| Toolbar / secondary   | `outline` `size="sm"`                                         |

## App shell

- Desktop: nav left · workspace center · chat right — never hide sidebar on desktop
- Import layout classes from `@/components/common/pageChrome`
- Toasts: `@/lib/toast` — Toaster already in `AppLayout`

## Scoped rules (read when relevant)

Full index: [`README.md`](./README.md)

[`page-header.md`](./page-header.md) · [`crud-table.md`](./crud-table.md) · [`filter-toolbar.md`](./filter-toolbar.md) · [`combobox.md`](./combobox.md) · [`date-format.md`](./date-format.md) · [`calendar-components.md`](./calendar-components.md) · [`split-view-master-detail.md`](./split-view-master-detail.md) · [`entity-form.md`](./entity-form.md) · [`module-pattern.md`](./module-pattern.md) · [`detail-pages.md`](./detail-pages.md) · [`status-and-money.md`](./status-and-money.md) · [`dialogs.md`](./dialogs.md) · [`checklist.md`](./checklist.md)

## Lint (`pnpm lint`)

Enforced in `apps/web/eslint.config.js`:

- `@phosphor-icons/react` — only allowed in `src/lib/icons.ts`
- `Select` / Radix select exports from `@oktavius/base-ui` — use `Combobox`
- Forbidden Tailwind: `text-gray-*`, `bg-white`, `rounded-lg` — use semantic tokens (`rounded-card`, `rounded-control`)
