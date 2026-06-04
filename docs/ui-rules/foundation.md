# Visual foundation

Hierarchy, tokens, and control states. Pair with [`ui-system.md`](./ui-system.md) (non-negotiable rules).

---

## Six surface levels

Level N must not contain another level N — only N+1 or deeper.

| Level | Name      | Surface                                              | Example                                  |
| ----- | --------- | ---------------------------------------------------- | ---------------------------------------- |
| 0     | App shell | `bg-muted/40` wash; chrome `APP_SHELL_SURFACE_CLASS` | Sidebar, header, chat                    |
| 1     | Page area | transparent (inherits wash)                          | `ModulePage` content                     |
| 2     | Top card  | `rounded-card bg-card`, no border/shadow             | `CrudMainView`, `DetailView`, `StatCard` |
| 3     | Section   | borderless; heading + spacing                        | `SectionCard`, `CollapsibleSection`      |
| 4     | Row       | transparent / `bg-muted` hover                       | `ListRow`, table row                     |
| 5     | Atom      | `bg-muted/60` inputs                                 | `Input`, `Button`                        |

**Violations:** `Card` in `Card`, `SectionCard` in `SectionCard`, shadow on page cards, `bg-background` on layout wrappers, gradients on surfaces.

**Attention order:** page title → one CTA → status/metadata → main content → secondary actions → meta/audit → row menus.

---

## Card content tiers

Inside cards use **`CARD_CONTENT_TIERS`** from `@oktavius/base-ui` — never ad-hoc sizes.

| Tier      | Token        | Use                                       |
| --------- | ------------ | ----------------------------------------- |
| Hero      | `.hero`      | Primary metric / identity (≤6 per region) |
| Highlight | `.highlight` | Important value + icon                    |
| Body      | `.body`      | Default values, row titles                |
| Label     | `.label`     | Field labels — sentence case              |
| Meta      | `.meta`      | Subtitles, timestamps                     |
| Micro     | `.micro`     | IDs, audit footnotes                      |

**DetailView `importance`:** `primary` → `RecordInfoHero`; `default` → grid; `meta` → `RecordInfoMeta` footer.

**Record visuals:** `RecordVisual` / `RecordIdentity` — image → avatar → icon; sizes `sm`–`xl`.

**StatCard row:** `STAT_CARD_GRID_CLASS`, max **6** cards.

---

## Color & tokens

Three layers — edit layer 1 & 3; use layer 2 in components:

```
neutral-0…950  →  card, muted, border, foreground  →  Tailwind semantic classes
                 +  cta, success, warning, …
```

| Task               | Where                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Tune grays / brand | `/showcase → Design tokens` → copy CSS to `globals.css`                 |
| Edit ramp          | `apps/web/src/styles/globals.css`                                       |
| Aliases            | `apps/web/src/lib/design-tokens/tokenRegistry.ts`                       |
| Shell chrome       | `APP_SHELL_SURFACE_CLASS` + `APP_SHELL_BORDER_CLASS` in `pageChrome.ts` |

**In components:** `bg-card`, `text-muted-foreground`, `bg-muted/60` — not `neutral-*`, `text-gray-*`, `bg-white`, raw `blue-500`.

**Radius:** `rounded-card` on surfaces, `rounded-control` on inputs/buttons — not `rounded-lg` / `rounded-xl` on content.

**Shadow:** only floating overlays (`shadow-elevated`) — never on `Card`, `CrudMainView`, `SectionCard`.

---

## Interactive states

Use primitive APIs — see `packages/base-ui/src/lib/controlStates.ts`.

| State       | API                                                                 |
| ----------- | ------------------------------------------------------------------- |
| Loading     | `Button loading`, `Combobox isLoading`, page `PageSkeleton`         |
| Disabled    | native `disabled` — no manual opacity hacks                         |
| Invalid     | `FormField error` / `EntityForm errors` → ring + `aria-invalid`     |
| Valid       | `valid` only after **explicit** confirmation — not “field has text” |
| Hover/focus | CSS on primitives — don’t toggle in JS                              |

**Affordances:** every pressable control needs hover + `focus-visible:ring` + `cursor-pointer`.

**Don’t:** manual button spinners; error text without invalid ring; `TooltipProvider` inside components (global in `AppLayout`).

---

## Typography (page level)

- One `text-xl font-semibold` title per page
- Subtitle: `text-sm text-muted-foreground`
- No `text-2xl`–`text-4xl` in module UI
- Section titles: `text-sm font-semibold`, sentence case
