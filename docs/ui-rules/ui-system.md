# Oktavius UI system

**Index:** [`README.md`](./README.md). **Patterns:** [`patterns.md`](./patterns.md). **Catalog:** [`component-registry.md`](./component-registry.md).

When in doubt, use these docs — do not invent layouts.

---

## Stack constraints

- React 19 + Tailwind v3 — semantic tokens only
- Icons: **`@/lib/icons` only** — never `@phosphor-icons/react`
- Lists: **`CrudMainView` / `CrudTable` only** — never custom `<table>`
- Single-select: **`Combobox` only** in `apps/web` — never `Select`
- Dates: **`formatDisplayDate` / `formatDisplayDateTime`** — `DD.MM.YYYY`
- Currency: **`<MoneyText>`** — no ad-hoc `formatMoney`

---

## Choose the page shell

| Need                             | Shell                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Entity list                      | `CrudMainView` + `shared.tsx` columns/formFields                                                                                    |
| Create/edit                      | `ModulePage` + `EntityForm`                                                                                                         |
| Simple detail                    | `ModulePage` + `DetailView`                                                                                                         |
| Many sections (scan one record)  | `ModulePage` + `MODULE_PAGE_SECTION_NAV_CLASS` + `AppSectionNavLayout`                                                              |
| Queue / master-detail            | `ModulePage fillHeight` + `SplitView`                                                                                               |
| Peer work modes (case workspace) | `ModulePage` + `Tabs` + `SectionCard` per tab — **last resort**                                                                     |
| Settings / catalogs              | `AppSectionNavLayout` + `SettingsSection` / `SettingsRow` — info left, control right ([`patterns.md`](./patterns.md#settings-rows)) |

Every route uses **`ModulePage`**. Never custom page headers.

**Module icon (required):** `icon={modulePageIcon()}` on every `ModulePage` and `CrudMainView` — `size={20} weight="duotone"`, match sidebar.

Detail recipes: [`patterns.md`](./patterns.md#detail-pages).

---

## Visual rules (non-negotiable)

See [`foundation.md`](./foundation.md) for hierarchy and tiers.

- Surfaces: `rounded-card bg-card` — **no borders** on cards, `CrudMainView`, `SplitView` outer
- Shell: `APP_SHELL_SURFACE_CLASS` + `APP_SHELL_BORDER_CLASS` from `pageChrome`
- Inputs: `bg-muted/60` — never `border border-input bg-background`
- Page wash: `bg-muted/40`; modules use white tiles on top
- No `text-gray-*`, `bg-white`, `rounded-lg` on named surfaces
- No cards-in-cards — `SectionCard` inside pages, not nested `Card`
- Interactive: hover + focus + `cursor-pointer` on all pressables

---

## Button hierarchy

| Context               | Variant                                                       |
| --------------------- | ------------------------------------------------------------- |
| List “New X”          | `cta` via `PageHeaderCtaLink`                                 |
| Dialog Save / Create  | `cta` via `EntityForm surface="dialog"` or `DialogFormFooter` |
| Dialog Cancel / Back  | `ghost`                                                       |
| Full-page form submit | `default`                                                     |
| Delete confirm        | `destructive` on `ConfirmActionDialog` / `AlertDialogAction`  |
| Toolbar / secondary   | `outline` `size="sm"`                                         |

At most **one** `variant="cta"` per header strip.

---

## App shell

- Desktop: nav left · workspace center · chat right — never hide sidebar on desktop
- **Nav:** Main (2) · Modules (`enabledModules`, scrollable, reorderable) · Admin — no per-module nav; long lists → `⌘K` palette
- **Section-nav pages:** sidebar compacts to icon rail; section nav + content scroll independently — [`patterns.md`](./patterns.md#section-nav)
- Toasts: `@/lib/toast` — Toaster in `AppLayout`

---

## UX & chunking (ERP)

Adapted for dense data — chunk **per screen**, not “cap total modules.”

| Surface                        | Limit                                                 |
| ------------------------------ | ----------------------------------------------------- |
| Detail `<TabsTrigger>`         | ≤6 (ESLint `max-detail-tabs-triggers`)                |
| List filters (`FilterToolbar`) | 3 slots (ESLint `max-list-filters`)                   |
| `extraTabs` on workspace tabs  | ≤3                                                    |
| Form section                   | 4–6 fields; more → new section / `CollapsibleSection` |
| Visible table columns          | 5–7; rest via column picker                           |
| `StatCard` row                 | ≤6                                                    |
| Settings section nav           | ≤6 categories                                         |

**Tabs are not the default for complexity.** Prefer `DetailView` → section nav → `SplitView` → preview-led layout → tabs only for peer modes.

**Nav when many modules:** org `enabledModules`, user reorder, command palette — do not invent sub-menus without product approval.

---

## Hard bans (agents)

```
❌ Card/SectionCard nesting (same level)
❌ border/shadow on Card, CrudMainView, SectionCard, SplitView outer
❌ @phosphor-icons/react, Select, custom <table>, window.confirm
❌ formatMoney, ad-hoc status Badge, raw palette colors, text-2xl+
❌ rounded-lg/xl on surfaces; border-input on inputs
❌ Multiple cta in one header; cta on full-page submit; default on dialog Save
❌ TooltipProvider in components; arbitrary spacing (mt-7, px-11)
❌ DetailView inside Tabs; manual Button spinners
❌ Raw Calendar classNames in sidebar — use CalendarMiniPicker
❌ Sliders / stacked two-control rows in settings — info left, control right; toggle > dropdown > field > slider
```

Full pattern examples: [`patterns.md`](./patterns.md) + [`foundation.md`](./foundation.md).

---

## Pre-submit checklist

- [ ] `ModulePage` / `CrudMainView` with `icon`
- [ ] Correct shell (not tabs when section-nav fits)
- [ ] `EntityForm` for forms; `Combobox` for selects
- [ ] `StatusBadge` + shared `variantMap`; `MoneyText` for money
- [ ] Header: status in `subtitle`; edit/delete icon-only
- [ ] `pnpm lint` clean

---

## Lint (`pnpm lint`)

`apps/web/eslint.config.js`:

- `@phosphor-icons/react` — only `src/lib/icons.ts`
- `Select` from `@oktavius/base-ui` — use `Combobox`
- Forbidden Tailwind: `text-gray-*`, `bg-white`, raw scales, `rounded-lg`
- `border` / `shadow` on `Card` / `SectionCard` / `CrudMainView` / `SplitView` surfaces
- Tab/filter UX limits (see table above)
