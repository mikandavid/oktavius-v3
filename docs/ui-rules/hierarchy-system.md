# Hierarchy System

## Purpose

Defines the six visual hierarchy levels of the ERP UI. Every element on screen belongs to
one of these levels. The level determines its background, border, shadow, spacing, and typography.
This system prevents visual chaos and eliminates the cards-in-cards problem structurally.

---

## The Six Levels

```
Level 0 → App Shell          (page wash, nav rail, top bar, agent chat)
Level 1 → Page Content Area  (inherits body background, no surface)
Level 2 → Top-Level Card     (rounded-card bg-card — no border, no shadow)
Level 3 → Section Content    (borderless — heading rule + spacing)
Level 4 → Row / Item         (transparent or bg-muted hover, border-border/50 or none)
Level 5 → Field / Atom       (bg-muted/60 inputs, text elements)
```

**The rule:** An element at level N must never contain another element at level N.
It may only contain elements at level N+1 or deeper.

---

## Level 0 — App Shell

Surface: page wash on `<body>` (`bg-muted/40` / `neutral-50` via CSS — not a layout className)

Includes:

- Main content area background
- Sidebar, header, agent chat (`APP_SHELL_SURFACE_CLASS` → `bg-card`)
- Page gutter / outer padding

Rules:

- Shell chrome shares one white surface — nav, header, and chat use `APP_SHELL_SURFACE_CLASS`, not separate tints.
- Never set a layout container to `bg-card` or `bg-background` for the full viewport — white tiles are Level 2+.
- Shell backgrounds must be flat. No gradients, no decorative patterns.
- Sidebar is structural. Keep it visually calm, no shadow, border-right only (`APP_SHELL_BORDER_CLASS`).
- Body background: let it inherit via CSS. Never manually set `bg-background` on layout wrappers.

Token reference: [`design-tokens.md`](./design-tokens.md).

Typography at this level:

- Sidebar nav items: `text-sm text-muted-foreground` → active: `text-foreground font-medium`
- Header: `text-sm font-medium`

---

## Level 1 — Page Content Area

Surface: transparent — inherits Level 0 body background

Includes:

- `ModulePage` content region
- Page header (title, subtitle, actions)
- The space between the sidebar and the content

Rules:

- Page title: `text-xl font-semibold` — only one per page
- Page subtitle: `text-sm text-muted-foreground`
- Page entry-point action (header "New X"): at most one per page, variant="cta". Everything else (form Save, dialog Confirm) uses variant="default" or lower.
- Spacing between page-level blocks: `space-y-4` (16px)
- Large section breaks at page level: `space-y-6` (24px)

The page header should answer within 2 seconds:

1. Where am I?
2. What record or module am I looking at?
3. What is the main action here?
4. What is secondary or supporting?

---

## Level 2 — Top-Level Card

Surface: `rounded-card bg-card` (100% white) — **no border, no shadow**

Includes:

- `Card` (generic)
- `StatCard` (KPI metric)
- `CrudMainView` unified table container
- `EntityForm` outer shell (page surface)
- `DetailView` outer shell
- `AlertBanner` (page-top, no radius, full width)

Rules:

- Level 2 surfaces float as **white tiles** on the `bg-muted/40` page wash — separation is contrast, not chrome.
- Do not add `border` or `shadow-sm` to Level 2 cards. Only floating overlays (dialogs, popovers) use shadow.
- A Level 2 card must never contain another Level 2 card.
- Maximum nesting: Level 2 → Level 3 only (prefer `SectionCard` borderless inside Level 2).

Typography inside Level 2:

- Card title: `text-sm font-semibold text-foreground` (via `CardTitle`)
- Card description: `text-xs text-muted-foreground`

---

## Level 3 — Section Content

Surface: **borderless** — heading rule (`border-b border-border/50`) + spacing, no card chrome

Includes:

- `SectionCard` — content sections inside module detail pages
- `CollapsibleSection`
- `StepperLayout` content regions
- `SettingsSection`
- Tabs content areas (`TabsContent` → usually contains `SectionCard`)

Rules:

- Level 3 surfaces live inside Level 1 (page area) or inside Level 2 (modal/dialog).
- They do not get borders or shadows on the outer container.
- Level 3 must never contain another Level 3 or Level 2 surface.
- Internal grouping inside Level 3: use spacing, dividers, or field group labels — not more bordered cards.

For grouping inside Level 3 without adding another container:

```
Option 1: Spacing gap (space-y-3 or space-y-4)
Option 2: Divider (border-t border-border/40)
Option 3: Field group label (text-xs uppercase tracking-[0.08em] text-muted-foreground)
Option 4: Muted background tint (bg-muted/30) — rare, semantic purpose only
```

Typography inside Level 3:

- SectionCard title: `text-sm font-semibold text-foreground`
- SectionCard meta: `text-xs text-muted-foreground`
- Field group label: `text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground`

---

## Level 4 — Row / Item

Surface: transparent (inherits Level 3 background) + optional hover `bg-muted/50`

Includes:

- `ListRow` — sub-entity items in SectionCard
- Table rows in `CrudTable` / `DataTable`
- `SettingsRow`
- Navigation items in sidebar

Rules:

- Rows do not get their own border by default unless the component requires it (`ListRow` uses `border-border/50`).
- Row hover must be subtle: `bg-muted/50` or `bg-muted` — not a color change.
- Selected row state: `bg-highlight` — muted, not the primary color.
- Row actions: ghost icon buttons on the right, visible on hover or via overflow menu.
- Bulk actions: appear only when rows are selected, not always visible.

Typography inside Level 4:

- Row title: `text-sm font-medium text-foreground`
- Row subtitle: `text-xs text-muted-foreground`
- Table cell: `text-sm text-foreground`
- Table header: `text-xs font-medium text-muted-foreground uppercase tracking-[0.04em]`

---

## Level 5 — Field / Atom

Surface: inputs = `bg-muted/60 rounded-control` (filled, no border); fills = `bg-muted` or transparent

Includes:

- `Input`, `Textarea`, `NumberInput`, `Combobox`, `DatePicker`
- `Badge`, `StatusBadge`, `CountBadge`, `Avatar`, `StatusDot`
- `Button`
- `Checkbox`, `Switch`
- Individual text elements (labels, values, meta)

Rules:

- Input height: `h-9` for all single-line inputs. Exception: `InlineEdit` uses `h-7`.
- Input style: filled grey — never `border border-input bg-background`.
- Input focus: `ring-2 ring-ring/40` — do not customize per component.
- Button height: `h-7` sm / `h-9` default / `h-10` lg / `h-9 w-9` icon.
- Never wrap a field in its own Level 3 surface (no bordered card per field).

---

## Hierarchy Summary Table

| Level | Name           | Background                | Border / chrome              | Shadow | Example                         |
| ----- | -------------- | ------------------------- | ---------------------------- | ------ | ------------------------------- |
| 0     | App Shell      | body + `bg-muted/40` wash | pane dividers only           | none   | Body, Sidebar                   |
| 1     | Page Content   | inherits wash             | none                         | none   | ModulePage area                 |
| 2     | Top-Level Card | `bg-card`                 | none                         | none   | Card, StatCard, CrudMainView    |
| 3     | Section        | transparent               | heading rule / dividers only | none   | SectionCard, CollapsibleSection |
| 4     | Row / Item     | transparent               | optional row dividers        | none   | ListRow, Table row              |
| 5     | Field / Atom   | `bg-muted/60` (input)     | none on inputs               | none   | Input, Button, Badge            |

---

## Visual Attention Flow

This is the order in which the eye should move through a page. Design every screen to match this sequence.

```
1. Page title                    → text-xl font-semibold (one, unambiguous)
2. Primary action                → variant="cta" button (one per region)
3. Status / key metadata         → near the title or in StatCard row
4. Main content block            → table, detail sections, or form
5. Secondary actions             → outline or ghost buttons
6. Supporting metadata           → muted text, meta labels, timestamps
7. Row-level / inline actions    → ghost buttons, overflow menus (revealed on hover)
```

If something outside this sequence demands attention, it is either missing semantic emphasis
or it has too much visual weight and should be quieted.

---

## Card Content Tiers (6 fixed sizes)

Inside any card surface (`Card`, `StatCard`, `DetailView`, `ListRow`), content uses exactly
**six fixed typography tiers** — never ad-hoc font sizes. This prevents spreadsheet-style layouts
where every label and value looks equally important.

| Tier          | Token                          | Use                                                     |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 1 — Hero      | `CARD_CONTENT_TIERS.hero`      | Record identity, primary metric — max 6 per card region |
| 2 — Highlight | `CARD_CONTENT_TIERS.highlight` | Important values with iconography                       |
| 3 — Body      | `CARD_CONTENT_TIERS.body`      | Default field values, row titles                        |
| 4 — Label     | `CARD_CONTENT_TIERS.label`     | Field labels — sentence case, never uppercase           |
| 5 — Meta      | `CARD_CONTENT_TIERS.meta`      | Subtitles, secondary context, timestamps                |
| 6 — Micro     | `CARD_CONTENT_TIERS.micro`     | IDs, codes, audit footnotes                             |

Import from `@oktavius/base-ui`: `CARD_CONTENT_TIERS`, `RecordInfoHero`, `RecordInfoMeta`, `DetailFieldGrid`.

### DetailView field importance

Set `importance` on each field:

- **`primary`** — rendered in `RecordInfoHero` at the top (large value + optional `icon`). Use for the 2–6 facts a user must see first.
- **`default`** — standard two-column grid (omit `importance` or set explicitly).
- **`meta`** — compact footer strip via `RecordInfoMeta`. Use for IDs, revision numbers, audit timestamps.

```
❌ Wrong — every field same size, uppercase labels, excel grid
<dt className="text-xs uppercase">RECORD ID</dt>
<dd className="text-sm">dbg_001</dd>

✅ Correct — hierarchy with tiers
importance="primary" + icon  →  hero tier at top
default fields               →  body tier in grid
importance="meta"            →  micro tier in footer strip
```

### StatCard rows

Use `STAT_CARD_GRID_CLASS` (`grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`). Maximum **6 StatCards per row**.
Each card has fixed min-height for grid alignment.

### ListRow hierarchy

- **Title** — tier 3 (`text-sm font-medium`; `text-base font-semibold` for `variant="queue"`)
- **Subtitle** — tier 5 (`text-xs text-muted-foreground`)
- **`meta` prop** — tier 6 (mono micro line for IDs, timestamps)

Never render three text lines at the same size.

### Record visuals (logo · avatar · icon)

Every record card should have a **visual anchor** so users recognize the entity before reading text.
Use `RecordVisual` / `RecordIdentity` — never raw `<img>` tags in modules.

| Kind     | Shape                                | When                                                                        |
| -------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `image`  | Rounded square (`rounded-control`)   | Client logo, product photo, vendor brand when `logoUrl` / `imageUrl` exists |
| `avatar` | Circle photo, else rounded icon tile | People (`UserIcon`), companies (`OrganizationIcon`) when no `logoUrl`       |
| `icon`   | Rounded square + muted fill          | Module/entity type fallback (product, case, order) when no photo            |

Fixed sizes: `sm` (list rows) · `md` · `lg` (identity band) · `xl` (hero panels).

```tsx
// Card top — like a branded order summary
<RecordIdentity
  visual={{ kind: 'image', src: vendor.logoUrl, alt: vendor.name }}
  title="Catering order #4821"
  subtitle="Due today 12:30"
  meta="ord_4821"
/>

// List row shorthand
<ListRow title={client.name} visual={{ kind: 'avatar', label: client.name }} … />

// DetailView
<DetailView visual={{ kind: 'icon', icon: <ProductIcon /> }} title={product.name} … />
```

Pick the most specific kind available: **image → avatar (with icon) → icon**. Never show initials as a fallback.

---

## Hierarchy Violations to Watch For

### Cards Inside Cards

Placing a `Card` or `SectionCard` inside another `Card` or `SectionCard` breaks the hierarchy.
Level 2 cannot contain Level 2. Level 3 cannot contain Level 3.

```
❌ Wrong
<Card>
  <CardContent>
    <Card>  ← Level 2 inside Level 2
      <CardContent>...</CardContent>
    </Card>
  </CardContent>
</Card>

✅ Correct
<Card>
  <CardContent>
    <SectionCard>  ← Level 3 inside Level 2
      ...
    </SectionCard>
  </CardContent>
</Card>

✅ Also correct — no card at all
<Card>
  <CardContent>
    <div className="space-y-3">  ← just spacing
      <p className="text-xs uppercase ...">Group label</p>
      <ListRow ... />
      <ListRow ... />
    </div>
  </CardContent>
</Card>
```

### Shadow at the Wrong Level

Shadow belongs on **floating overlays only** (dialogs, popovers, dropdowns, tooltips) — `shadow-elevated`.
Never apply shadow to page-anchored surfaces: `Card`, `SectionCard`, `CrudMainView`, table rows, sidebar, or page sections.
The `shadow-card` token is `none`; do not re-enable it on cards.

### Equal Spacing Between Unequal Relationships

Related elements grouped at `gap-4`. Unrelated blocks also at `gap-4`. Hierarchy is invisible.
Use less gap between closely related content, more gap between distinct groups.

### Primary Color Everywhere

Using `variant="cta"` or `text-primary` for every highlighted element destroys the attention hierarchy.
Primary color means: "do this now." Use it for one action per region, not for styling.
