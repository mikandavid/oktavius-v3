# Visual Foundation

## Purpose

Single source of truth for colors, typography, spacing, borders, shadows, and radius.

**Code-specific rules:** [`ui-system.md`](./ui-system.md) and [`component-registry.md`](./component-registry.md) take precedence for component APIs and patterns.

---

## Color System

### Architecture (three layers)

```
Layer 1  neutral-0 … neutral-950     Single source of truth for gray (globals.css)
              ↓ aliases
Layer 2  card, muted, border, …      Semantic roles — use these in components
              +
Layer 3  cta, success, warning, …    Brand + state colors (independent hues)
              ↓
         Tailwind classes            bg-card, text-muted-foreground, bg-cta
```

**Tune grays:** edit the neutral ramp in [`/showcase → Design tokens`](./design-tokens.md#token-playground) or `globals.css`.  
**In components:** always use Layer 2 roles (`bg-card`, `text-muted-foreground`) — never `bg-neutral-200` for layout.  
**Raw ramp steps:** calendar gray events, chart series, data viz only.  
**Full reference:** [`design-tokens.md`](./design-tokens.md)

### Philosophy

Color communicates hierarchy and meaning. Never decoration.

Use color for:

- The single primary action on a page (`variant="cta"`)
- Semantic state (success / warning / destructive / info)
- Active/selected system states (`sidebar-primary`)
- Links inside text
- Data series in charts

Do not use color to make a plain layout feel more interesting.

### Layer 1 — Neutral ramp

Defined in `apps/web/src/styles/globals.css`. Light mode: `0` = pure white, `950` = near-black. Dark mode: `50` = deepest surface, `950` = primary text (monotonic scale).

| Step          | Light role            | Dark role               |
| ------------- | --------------------- | ----------------------- |
| `neutral-0`   | Pure white card       | Elevated popover base   |
| `neutral-50`  | Page background       | Deepest page canvas     |
| `neutral-100` | Secondary fills       | Card surface            |
| `neutral-200` | Muted fills, inputs   | Popover, sidebar accent |
| `neutral-300` | Borders, input chrome | Muted fills             |
| `neutral-600` | Muted text            | Borders                 |
| `neutral-950` | Primary text          | Primary text            |

### Layer 2 — Semantic roles (aliases)

Always use these in components. Never hard-code hex or Tailwind default palette scales (`blue-500`, `rose-200`, etc.).

```
text-foreground           Primary text          → neutral-950
text-muted-foreground     Secondary text        → neutral-600 / neutral-800
text-destructive          Errors, delete
text-success / warning / info   State text

bg-card                   White tiles           → neutral-0 / neutral-100
bg-muted/40               Page wash only        (only background tint in app)
bg-muted/60               Input fill
bg-muted/80               Input hover
bg-muted                  Button / row hover    → neutral-200 / neutral-300

border-border             Rules & dividers      → neutral-300 / neutral-600
border-border/70          Section dividers
border-border/50          Row separators, SplitView splits
ring-ring                 Focus rings           (CTA hue, OKLCH)
```

### Layer 3 — Shell chrome

Nav rail, top header, and agent chat rail share one surface — import from `@/components/common/pageChrome`:

```typescript
APP_SHELL_SURFACE_CLASS; // bg-card
APP_SHELL_BORDER_CLASS; // border-border/60
```

Do not use separate background tokens per shell region. `--sidebar-background` aliases `--card`.

Full alias tables, playground workflow, and file index: [`design-tokens.md`](./design-tokens.md).

### Brand & state colors

| Token                                          | Format       | Use                                                 |
| ---------------------------------------------- | ------------ | --------------------------------------------------- |
| `cta`                                          | OKLCH violet | Primary actions, sidebar active, calendar violet    |
| `accent`                                       | OKLCH tint   | Subtle violet backgrounds                           |
| `destructive` / `success` / `warning` / `info` | HSL          | Status, badges, banners                             |
| `teal` / `orange`                              | HSL          | Calendar categories, chart series                   |
| `highlight`                                    | HSL          | Selected rows (light: blue tint; dark: neutral-500) |

Primary button (`bg-primary`) aliases `neutral-900` — near-black in light, near-white in dark. CTA is brand violet (`bg-cta`).

### Semantic palette helper

Components must not define inline tone class maps. Use `@oktavius/base-ui`:

```typescript
import { getSemanticToneClasses, pickSemanticToneBySeed } from '@oktavius/base-ui';

getSemanticToneClasses('success', 'soft'); // AlertBanner, ListRow warning
getSemanticToneClasses('info', 'softEmphasis'); // Badge, InfoBox
getSemanticToneClasses('warning', 'solid'); // Calendar solid fills
getSemanticToneClasses('neutral', 'dot'); // StatusDot
pickSemanticToneBySeed(userId); // Categorical assignment (avatars, tags)
```

Variants: `soft` · `softEmphasis` · `solid` · `dot` · `dotMuted` · `text` · `ring`

Tones: `neutral` · `primary` · `cta` · `info` · `success` · `warning` · `destructive` · `highlight` · `teal` · `orange`

### Categorical colors

| Token             | Use                                                         |
| ----------------- | ----------------------------------------------------------- |
| `cta`             | Brand violet — primary CTA, sidebar active, calendar violet |
| `teal` / `orange` | Calendar category fills, multi-series charts                |
| `highlight`       | Selected rows, contextual emphasis backgrounds              |

### Semantic State Mapping

```
active / approved / completed / healthy   → success
pending / waiting / review needed         → warning
failed / rejected / deleted / blocked     → destructive
in progress / informational               → info
inactive / secondary / empty              → muted / secondary
selected / contextual emphasis            → highlight
```

### Color Hard Rules

- Never use the primary color as a generic selection highlight everywhere. It loses meaning.
- Never invent local module status colors. Use the semantic tokens above.
- Never use random Tailwind palette colors (e.g. `text-blue-500`, `bg-rose-200`, `bg-teal-500` for layout).
- Never use raw `neutral-*` ramp steps for layout surfaces — use semantic roles (`bg-card`, `bg-muted`).
- Never assign different backgrounds to nav, header, and chat — use `APP_SHELL_SURFACE_CLASS`.
- Never duplicate tone class strings in components — use `getSemanticToneClasses()` from `@oktavius/base-ui`.
- Status must never rely on color alone. Pair with text, icon, or label.
- Do not tint entire page backgrounds with accent color.
- Dark mode: keep surfaces especially border-led; avoid bright containers entirely.

---

## Typography

### Fonts

```
--font-sans: 'Inter'      → all UI text
--font-mono: 'Space Mono' → IDs, codes, tokens, logs, machine-readable values
--font-serif: 'Lora'      → document-preview contexts only, never general UI
```

Do not introduce additional font families.

### Type Scale (Resolved)

```
Page title:          text-xl  (20px) / font-semibold / tracking-tight
Card / section title: text-sm (14px) / font-semibold / text-foreground
Subsection / group:  text-xs  (12px) / font-semibold / uppercase / tracking-[0.08em] / text-muted-foreground
Body:                text-sm  (14px) / font-normal
Label:               text-sm  (14px) / font-medium  or  text-xs / font-medium (dense)
Meta / description:  text-xs  (12px) / text-muted-foreground
Table cell:          text-sm  (14px) / font-normal
Badge:               text-xs  (12px) / font-medium
Button (all sizes):  text-sm  (14px) except size="sm" which uses text-xs
```

### Typography Hierarchy Rules

1. Semibold for page titles and card/section headings.
2. Medium for labels, column headers, and UI controls.
3. Regular for body text and table cell content.
4. Muted foreground for meta, descriptions, secondary information.
5. Mono only for IDs, codes, logs, technical values.

### Section Heading Style — Resolved

Two distinct treatments. Do not mix them:

**Card / SectionCard title** (prominent section heading inside a bordered surface):

```
text-sm font-semibold text-foreground
```

Used in: `CardTitle`, `SectionCard` title prop, `DetailView` section titles.

**Page-level group label / field group label** (quiet organizer between content blocks):

Import `FIELD_GROUP_LABEL_CLASS` from `@/components/common/pageChrome` (same string as below).

```
text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground
```

Used in: `EntityForm` section headings, custom fields, form layout editor, showcase dividers.

**DetailView / field label** (inside cards):

```
text-xs font-medium text-muted-foreground   (sentence case — CARD_CONTENT_TIERS.label)
```

Used in: DetailView, DetailFieldGrid, RecordInfoHero labels. Never uppercase spreadsheet-style headers.

**StatCard label** (compact KPI context only):

```
text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground
```

Do not use uppercase on card titles, SectionCard titles, dialog titles, or page headings.
Do not use text-xl or larger inside ERP modules except the page title.
Do not use negative letter-spacing anywhere.

### Line Length

Operational text (form descriptions, tooltips, inline hints): 1–2 lines max.
Prose in settings/help panels: 60–80 characters per line max.
Never use long uninterrupted paragraphs on operational ERP screens.

---

## Spacing Scale

Base unit: 4px. All spacing derives from multiples.

```
gap-0.5  →  2px
gap-1    →  4px
gap-1.5  →  6px
gap-2    →  8px
gap-3    →  12px
gap-4    →  16px
gap-5    →  20px
gap-6    →  24px
gap-8    →  32px
gap-10   →  40px
gap-12   →  48px
gap-16   →  64px
```

Most ERP screen spacing lives between 4px and 24px. Use 32px+ only for major page-level separation.

### Spacing by Relationship

```
Icon + label gap:               gap-1.5 or gap-2
Controls within a button group: gap-2
Form field gap (label→input):   gap-1.5
Form fields within a section:   gap-4 (grid gap)
Form sections gap:              space-y-6
Page content blocks:            space-y-4
Large page section breaks:      space-y-6
Table cell padding:             px-3 py-2
Card internal padding:          p-4
Dialog padding:                 p-4 to p-6
Sidebar item padding:           px-2 py-1.5
```

Do not use arbitrary spacing values like `mt-7`, `px-11`, or `mb-[13px]`.
Do not apply equal spacing between unrelated and related groups.

---

## Surfaces — Borderless White Tiles

Page wash + white tiles. Separation comes from **contrast** (white-on-tint), not borders.

| Surface                                                                                 | Treatment                                                    |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `Card`, `StatCard`, `CrudMainView` container                                            | `rounded-card bg-card` — no border, no shadow                |
| `Dialog`, `Popover`, `DropdownMenu`, `Tooltip`, `Combobox`/`Select` content             | `bg-popover` + `shadow-elevated` — floats above page         |
| `SectionCard`, `CollapsibleSection`, `SettingsRow`, `AttachmentList`, `SplitView` outer | borderless — heading rule / row dividers / spacing only      |
| Page main area                                                                          | `bg-muted/40` — only background tint                         |
| Shell chrome (nav, header, chat)                                                        | `APP_SHELL_SURFACE_CLASS` (`bg-card`) — shared white surface |
| Inputs                                                                                  | `bg-muted/60` filled-grey (no border)                        |

### Hard Rules

- Cards alias `neutral-0` (pure white in light). Never re-tint `bg-card` with accent colors.
- Never re-add `border` to `Card`, `StatCard`, `CrudMainView` table container, or `SplitView` outer.
- Page wash (`bg-muted/40`) is the only background tint. Containers sit on top as white tiles.
- Inputs stay filled-grey so form fields read as carved without borders. Never use `border border-input bg-background` on inputs.
- Dark mode: keep flat — no shadows on cards, no extra borders to "compensate" for the loss of contrast.

---

## Borders — Rules, Not Chrome

Borders are reserved for **dividers and rules between sibling content**. Not container chrome.

### Where borders ARE used

```
border-border/70    Section dividers inside EntityForm / DetailView
border-border/50    SectionCard heading underline
                    SettingsRow row separator (border-b, last:border-b-0)
                    SplitView sidebar/content split (border-r)
                    AttachmentList row dividers (divide-y)
                    ListRow borders (default variant)
border-dashed border-border/60    InlineEmptyState, ListRow variant="dashed"
```

### Where borders are NOT used

- Card, StatCard, CrudMainView container, SectionCard outer, SplitView outer
- Sidebar outer, page main wrapper

---

## Shadow System — Floats Only

Shadow exists to lift things **above** the page. Never to outline things **on** the page.

### Shadow Rules by Context

**Floating overlays — require `shadow-elevated`:**

- `Dialog`, `AlertDialog`
- `Popover`, `Tooltip`
- `DropdownMenu`, `Combobox`/`Select` content
- Floating token editor / nav rails
- Toast

**Everything on the page — no shadow:**

- `Card`, `StatCard`, `CrudMainView`, `SectionCard`, `ListRow`
- Sidebar, Header, MobileTopBar
- Tabs, table rows, form fields

**Dark mode:** No shadow anywhere. Use brightness contrast.

### Shadow Hard Rules

- `shadow-card` token is set to `none`. Don't re-enable it.
- Never apply shadow to anchored page surfaces (Card, SectionCard, ListRow, table rows, sidebar, header).
- Never apply shadow to form fields.
- Do not stack shadow + heavy tint on the same surface.

---

## Interactive Affordances

Every clickable or pressable control must **look interactive before the user clicks**.
Hover, active (press), and focus-visible states are required — not optional polish.

### Required signals

| Signal  | When                     | Classes / pattern                                                            |
| ------- | ------------------------ | ---------------------------------------------------------------------------- |
| Pointer | Mouse-targetable control | `cursor-pointer` (or `cursor-grab` for drag handles)                         |
| Hover   | All pressable surfaces   | Background or text shift — e.g. `hover:bg-muted/50`, `hover:text-foreground` |
| Active  | Buttons and primary taps | Slightly stronger fill — e.g. `active:bg-muted/80`, `active:bg-cta/80`       |
| Focus   | Keyboard navigation      | `focus-visible:ring-2 focus-visible:ring-ring/40`                            |
| Motion  | State changes            | `transition-colors` (150–200ms) on interactive surfaces                      |

### Patterns by control type

**Buttons (`Button`)** — variants ship hover + active. Do not strip them with `className`.

**Filled inputs / triggers (Combobox, DatePicker, Select)** — `hover:bg-muted/80` on the trigger.

**Ghost / text actions** — at minimum `hover:text-foreground` or `hover:bg-muted/50`.

**Clickable rows (ListRow, TableRow, SettingsTable)** — row background on hover + `cursor-pointer` when `onClick` / `href` is set.

**Tabs** — underline bar; inactive triggers get `hover:text-foreground` and a subtle bottom border hint.

**Toggles (Checkbox, Switch, Radio)** — `cursor-pointer` + hover fill on the control surface.

**Custom click targets** — use shared helpers from `@oktavius/base-ui` `interactiveSurfaceClasses` / `interactiveTextClasses` in `lib/utils.ts`.

```tsx
// ✅ Clickable row — hover + pointer
<ListRow title="Acme GmbH" onClick={() => open(row)} />

// ✅ Custom div acting as button
<div
  role="button"
  tabIndex={0}
  className={cn(interactiveSurfaceClasses, 'rounded-control px-2 py-1.5')}
  onClick={handleClick}
>

// ❌ Click handler with no affordance
<div onClick={handleClick}>Edit</div>
```

### Hard rules

- Never attach `onClick` to a plain element without hover/active/focus styles.
- Never use `cursor-pointer` alone — pair it with a visible hover change.
- Disabled controls: `disabled:cursor-not-allowed disabled:opacity-50` and **no** hover state.
- Non-interactive surfaces must not look clickable (no pointer, no hover fill on static text/cards).

### Validation and async states

Full matrix and APIs: [`interactive-states.md`](./interactive-states.md).

| State                  | Filled inputs / triggers                                           | Buttons                                             |
| ---------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| Invalid                | `ring-2 ring-destructive` via `FormField error` or `aria-invalid`  | —                                                   |
| Valid (confirmed only) | `ring-2 ring-success` via `valid` prop — not on every filled field | —                                                   |
| Loading                | Combobox `isLoading`                                               | `Button loading` — spinner + `aria-busy` + disabled |
| Disabled / blocked     | `disabled:` — suppress hover fill                                  | same                                                |

Use shared helpers from `controlStates.ts` (`filledControlClasses`, `controlValidationClasses`) — do not duplicate strings in new primitives.

---

## Radius

Semantic tokens in `globals.css` — use these, not raw Tailwind radius on named surfaces.

```
rounded-card      → var(--radius-card)      — Card, StatCard, CrudMainView, panels
rounded-control   → var(--radius-control)   — Input, Button, Combobox trigger, filter pills
rounded-badge     → var(--radius-badge)     — Badge, chips
rounded-full              → Avatar, CountBadge, StatusDot, pill badges
```

Hard rules:

- Named surfaces: `rounded-card` — never `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Controls: `rounded-control`
- Do not over-round cards — ERP is not a consumer app.
