# UX Principles

## Purpose

Design rules derived from established sources, **adapted for Oktavius v3 ERP** — dense data, many modules per tenant, long sessions, and mixed expert/casual users.

Sources:

- [Laws of UX](https://lawsofux.com) — cognitive and interaction laws (selective adoption below)
- [Figma UI Design Principles](https://www.figma.com/resource-library/ui-design-principles/)
- [Anthony Hobday, Visual Design Rules](https://anthonyhobday.com/sideprojects/saferules/)

**When to read:** Any information architecture decision (tabs, filters, nav, forms, settings). Pair with [`component-guide.md`](./component-guide.md) and [`ui-system.md`](./ui-system.md).

---

## How we use Laws of UX in ERP

Enterprise products **cannot** pretend complexity does not exist. A funeral tenant may need Sterbefälle, Kontakte, Katalog, and eight branches; a generic tenant may enable cases, clients, orders, and reports. Our approach:

1. **Move complexity to the right layer** — not every choice belongs on one screen (Tesler’s Law).
2. **Chunk per screen** — Miller’s 7±2 applies to _what users parse at once_ (filters on a list, fields in a form section, tabs on a detail page), not to “total modules in the product.”
3. **Use the app shell we already ship** — org-scoped sidebar, scrollable module list, user reorder, compact icon rail, command palette (`⌘K`), section-nav for deep records.
4. **Keep patterns familiar** — list → detail, tabs, settings rows (Jakob’s Law).
5. **Enforce consistency in code** — `CrudMainView`, `EntityForm`, `StatusBadge` (see [`agent-contract.md`](./agent-contract.md)).

We do **not** copy every law from [lawsofux.com](https://lawsofux.com). Laws that matter less for back-office ERP (e.g. gamified goal-gradient, Von Restorff for marketing landing pages) are omitted unless a feature explicitly needs them.

---

## Laws we adopt (ERP mapping)

| Law                            | ERP use                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Hick’s Law**                 | Few choices per _decision point_ (toolbar, filter row, row menu, stepper).                      |
| **Miller’s Law**               | Chunk fields, filters, tabs, and visible columns — not “cap total modules.”                     |
| **Fitts’s Law**                | Large primary targets; destructive actions smaller or behind confirm/overflow.                  |
| **Serial position**            | Overview tab first; admin/settings last; identity column first in tables.                       |
| **Aesthetic-usability**        | Tokenized UI — users trust financial/legal data when layout looks precise.                      |
| **Jakob’s Law**                | Match common ERP patterns (sidebar + list + detail + tabs); don’t invent new chrome per module. |
| **Doherty threshold**          | Show feedback within ~400ms (`Button loading`, skeletons, optimistic toast).                    |
| **Tesler’s Law**               | Complexity is conserved — expose it in tabs/steps/filters, don’t dump it on one page.           |
| **Paradox of the active user** | Sensible defaults, inline help via labels/descriptions — no manual-first flows.                 |
| **Pareto (80/20)**             | Default filters and columns show what 80% of users need; rest behind advanced/column picker.    |
| **Chunking**                   | Group combobox options, settings categories, form sections with headings.                       |
| **Law of proximity**           | Spacing scale ties labels to inputs and separates destructive actions (Figma § Proximity).      |

---

## App navigation model (canonical)

Implemented in `apps/web/src/components/layout/Sidebar.tsx` and `CommandPalette.tsx`. **Do not** invent parallel nav patterns in modules.

| Layer | Section                    | Role                                                        | Chunking                                                       |
| ----- | -------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| 1     | **Main** (`PRIMARY_ITEMS`) | Dashboard, AI Chat — always 2 items                         | Fixed, small                                                   |
| 2     | **Modules**                | Tenant-enabled ERP modules from `OrgProfile.enabledModules` | May be **>7**; list scrolls inside sidebar (`overflow-y-auto`) |
| 3     | **Admin**                  | Settings, superadmin, showcase — separated from daily work  | ≤3 items; dangerous/rare actions last                          |

**When module count is high:**

- Rely on **org profile** to hide irrelevant modules (see `apps/web/src/lib/org-profiles/`).
- Users may **reorder** modules (sidebar edit mode → `localStorage`).
- **Command palette** is the fast path for infrequent modules — not another sidebar section.
- **Compact sidebar** (icon rail) on section-nav pages — see [`section-nav.md`](./section-nav.md).

**Do not** add a hard cap of 7 module links or split modules into arbitrary sub-menus without product approval. If a tenant needs fewer visible modules, change `enabledModules`, not the shell.

**Serial position in sidebar:** Most-used modules at the top of the Modules list (user order + sensible defaults in `MODULE_ITEMS`). Settings and superadmin stay in Admin, never between daily modules.

---

## Hierarchy (Figma Principle 1)

**Rule:** Use font size, weight, color contrast, and spacing to show what matters most.

**ERP application:**

- One `text-xl font-semibold` page title — one, never two.
- At most ONE `variant="cta"` in the page header (“New X”). Dialog Save/Create use `cta`; full-page form submit uses `default`.
- Status / key metadata immediately below the title, not buried in a tab.
- Table column order: identity first, status second, detail columns after.
- Never give decorative elements visual weight equal to functional ones.

---

## Progressive Disclosure (Figma Principle 2)

**Rule:** Show only what users need at each step. Break complexity into stages.

**ERP application:**

- Multi-step creation flows: use `StepperLayout` — never a single huge form.
- Detail pages with 4+ major areas: first choose the anatomy (`DetailView`, `AppSectionNavLayout`, `SplitView`, preview-led layout). Use `Tabs` only for peer work modes.
- Long optional field groups: use `CollapsibleSection`, collapsed by default.
- Overview tab: top 3–5 items per sub-entity with “View all” — not the full list.
- `CountBadge` on `TabsTrigger`; `attention` when a section needs action.

---

## Consistency (Figma Principle 3) · Jakob’s Law

**Rule:** Patterns must look and work the same everywhere. Users already know list/detail, tabs, and settings from other business apps.

**ERP application:**

- All entity lists: `CrudMainView` / `CrudTable`.
- All create/edit: `EntityForm`.
- All status: `StatusBadge`; dates: `DD.MM.YYYY`; currency: `MoneyText`.
- All empty states: `EmptyState` / `InlineEmptyState`.
- Destructive confirms: `ConfirmActionDialog` or `AlertDialog`.
- Shell: `ModulePage` + documented layout — never a one-off page frame per module.

---

## Contrast (Figma Principle 4)

**Rule:** Higher contrast for critical elements; neutral for secondary.

**ERP application:**

- `text-foreground` for primary; `text-muted-foreground` for secondary.
- `variant="destructive"` only for delete/irreversible.
- `variant="ghost"` for toolbar/icon actions.
- One `variant="cta"` per header strip.
- Icons beside text: slightly lower contrast than the label.

---

## Proximity · Law of Proximity

**Rule:** Related controls sit close; unrelated elements have more space.

**ERP application:**

- Label + input: `gap-1.5`. Fields in a section: `gap-4`. Between sections: `space-y-6`.
- Destructive button separated from primary — not adjacent.
- Logout / admin nav not mixed with high-frequency module links (Admin section).

---

## Alignment (Figma Principle 7)

**Rule:** Strong grid; every element aligns to something.

**ERP application:**

- Gutter: `APP_MAIN_GUTTER_CLASS` — no extra outer padding in modules.
- `EntityForm` / `DetailView` / `CrudTable` alignment as in [`entity-form.md`](./entity-form.md) and [`crud-table.md`](./crud-table.md).
- Page header: title left, primary CTA right.

---

## Hick’s Law (Laws of UX)

**Rule:** Decision time grows with the number and complexity of choices.

**ERP application — per decision surface, not per product:**

| Surface                          | Guideline                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `FilterToolbar`                  | 3–4 filters visible; rest under “Advanced” ([`filter-toolbar.md`](./filter-toolbar.md))                     |
| `Combobox`                       | Group when >8 options; use `description`                                                                    |
| Row `DropdownMenu`               | ≤3 primary actions visible; rare actions after separator or sub-menu                                        |
| `StepperLayout`                  | 4–5 steps max; split flows if more                                                                          |
| Settings (`AppSectionNavLayout`) | ≤6 top-level categories                                                                                     |
| **Sidebar Modules**              | Not capped at 7 — use org filter + palette + scroll (see [App navigation](#app-navigation-model-canonical)) |

---

## Fitts’s Law (Laws of UX)

**Rule:** Time to hit a target depends on distance and size.

**ERP application:**

- Mobile: `min-h-[44px]` where touch matters; desktop row actions ≥ `h-7 w-7`.
- Primary CTA: largest button on the page (`variant="cta"`, `size="lg"`).
- Delete: smaller or behind overflow + confirm — intentional friction.
- Sidebar links: full-width hit area, not text-only.
- Dialog: primary confirm larger emphasis than cancel (`ghost`).

---

## Miller’s Law · Chunking (Laws of UX)

**Rule:** Working memory holds ~7±2 items; group information into meaningful chunks.

**ERP application — chunk on the screen the user is viewing:**

| Surface           | Guideline                                                                          |
| ----------------- | ---------------------------------------------------------------------------------- |
| Form section      | 4–6 fields; more → new section or `CollapsibleSection`                             |
| `Tabs` on detail  | Only for peer work modes; ≤6 tabs; more → rethink IA or use section-nav            |
| `CrudTable`       | 5–7 visible columns; more → column visibility                                      |
| `StatCard` row    | 3–6 cards (`STAT_CARD_GRID_CLASS`)                                                 |
| `MultiSelect`     | Group options >9; show selected count                                              |
| Dashboard widgets | Fewer, denser cards — not 12 equal KPIs                                            |
| **Sidebar**       | Sections (Main / Modules / Admin) are chunks; module list may exceed 7 with scroll |

---

## Serial Position Effect (Laws of UX)

**Rule:** First and last items in a sequence are remembered best.

**ERP application:**

- Sidebar: frequent modules first; Admin last.
- Page header: back/cancel left; primary CTA rightmost.
- Forms: required/identity first; optional/advanced last.
- `CrudTable`: identity first, actions last, status near front.
- Tabs: **Overview** first; settings/admin tab last when present.

---

## Tesler’s Law · Conservation of Complexity (Laws of UX)

**Rule:** Every system has irreducible complexity; the design choice is _where_ it lives.

**ERP application:**

- **List page** — search, sort, pagination, export (not on detail).
- **Detail tabs** — one domain per tab (parties, documents, workflow).
- **Create flow** — `StepperLayout` or dialog wizard, not 40 fields at once.
- **Settings** — section nav + `SettingsRow`, not one scrolling mega-form.
- **Agent/chat** — structured result cards, not raw JSON.

Never “simplify” by hiding required legal/financial fields; relocate them to the correct step or tab.

---

## Doherty Threshold (Laws of UX)

**Rule:** Productivity stays high when user and system respond in under ~400ms.

**ERP application:**

- Use `<Button loading>` for submits; `PageSkeleton` / table loading props — no frozen UI.
- Toasts via `@/lib/toast` for async completion.
- Avoid blocking the whole page for a single row action when a local spinner suffices.
- Debounce search inputs in `FilterToolbar`; don’t refetch on every keystroke without feedback.

---

## Paradox of the Active User (Laws of UX)

**Rule:** Users start using the product immediately; they won’t read manuals first.

**ERP application:**

- Empty states explain the next action (`EmptyState` with CTA).
- `DialogDescription` on non-obvious dialogs.
- Combobox `description` for ambiguous options.
- Sensible defaults on `EntityForm` (today’s date, org context, last-used filters where safe).
- Showcase (`/showcase`) for developers — not the onboarding path for end users.

---

## Pareto Principle (Laws of UX)

**Rule:** Roughly 80% of outcomes come from 20% of inputs.

**ERP application:**

- Default table columns: name, status, date, owner — not every custom field.
- Default filters: status + date range + search — not every attribute.
- Overview tab: summary metrics and top items — full history in Activity tab.
- Reports builder: start from templates; advanced fields collapsed.

---

## Aesthetic-Usability Effect (Laws of UX)

**Rule:** Polished UI is perceived as more correct and trustworthy.

**ERP application:**

- Semantic tokens only — no random palette colors per module.
- `bg-muted/40` page wash; `rounded-card` tiles.
- `MoneyText` tabular numerals for money.
- Consistent spacing scale and one `text-xl` title per page.
- See [`visual-foundation.md`](./visual-foundation.md) and [`hierarchy-system.md`](./hierarchy-system.md).

---

## Nested Corner Radius (Anthony Hobday, Rule 24)

**Rule:** Inner radius ≈ outer radius minus gap; if gap > outer radius, inner radius → 0.

**ERP application:**

```
Outer card:     rounded-card
Card padding:   p-4 (gap > radius)
→ Inner controls: rounded-control (not rounded-card on nested surfaces)

Dialog:         rounded-card
→ No nested Card inside dialogs
```

Inside a `rounded-card` surface, inputs and badges use `rounded-control` unless they own a separate bordered box.

---

## Icon-Text Contrast (Anthony Hobday, Rule 28)

**Rule:** Icons with text should be slightly lower contrast than the label.

```tsx
// ✅ Icon quieter than label
<Button variant="cta" size="lg">
  <PlusIcon size={16} className="opacity-80" />
  New client
</Button>

// ❌ Icon same weight as label
<PlusIcon size={16} />
<span className="font-medium">New client</span>
```

Icon-only buttons: full contrast is OK (icon is the label).

---

## Adjacent Hard Divides (Anthony Hobday, Rule 25)

**Rule:** One boundary method per relationship — not border + separator + background shift stacked.

**ERP application:**

- `SectionCard`: `border-t border-border/40` for internal splits — not double borders.
- `ListRow` lists: `space-y-2`; row border is enough.
- `EntityForm` sections: heading + spacing — not a card per section.

---

## Quick checklist (agents)

Before shipping IA-heavy UI:

1. List/detail/settings use standard shells — no custom nav.
2. Choices on **this screen** respect Hick/Miller (filters, tabs, form sections, columns).
3. Sidebar/module count handled via org profile + palette, not fake 7-link cap.
4. Overview tab first; destructive actions confirmed and separated.
5. Async actions show loading or skeleton within one interaction beat (Doherty).

Full pre-submit list: [`agent-contract.md`](./agent-contract.md).

### Lint enforcement (`pnpm lint`)

| Limit                                      | Value | Rule file                                                                          |
| ------------------------------------------ | ----- | ---------------------------------------------------------------------------------- |
| `<TabsTrigger>` on detail pages            | ≤6    | `apps/web/eslint-rules/max-detail-tabs-triggers.mjs`                               |
| `*Filters` / `build*Filters()` arrays      | ≤3    | `apps/web/eslint-rules/max-list-filters.mjs` (matches `FILTER_TOOLBAR_SLOT_COUNT`) |
| `extraTabs` on `EntityDetailWorkspaceTabs` | ≤3    | same (`max-list-filters.mjs`)                                                      |

Constants: `apps/web/eslint-rules/ux-limits.mjs`.
