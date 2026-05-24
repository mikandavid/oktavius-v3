# UX Principles

## Purpose

Design rules derived from established external sources, applied to the OktaviusV3 ERP context.
Each principle includes its source, the core rule, and how it applies specifically to this product.

Sources:

- Figma UI Design Principles: https://www.figma.com/resource-library/ui-design-principles/
- Anthony Hobday, Visual Design Rules: https://anthonyhobday.com/sideprojects/saferules/
- Laws of UX: https://lawsofux.com

---

## Hierarchy (Figma Principle 1)

**Rule:** Use font size, weight, color contrast, and spacing to show what matters most.
Users decide within milliseconds what to look at first. Design must match their intent.

**ERP application:**

- One `text-xl font-semibold` page title — one, never two.
- At most ONE `variant="cta"` in the page header (“New X”). Dialog Save/Create use `cta`; full-page form submit uses `default`.
- Status / key metadata immediately below the title, not buried in a tab.
- Table column order: identity first, status second, detail columns after.
- Never give decorative elements visual weight equal to functional ones.

---

## Progressive Disclosure (Figma Principle 2)

**Rule:** Show only what users need at each step. Break complexity into stages.
Give orientation cues so users know where they are and what's left.

**ERP application:**

- Multi-step creation flows: use `StepperLayout` — never a single huge form.
- Detail pages with 4+ major areas: use `Tabs` — show one domain at a time.
- Long optional field groups in forms: use `CollapsibleSection`, collapsed by default.
- Overview tab: show top 3–5 items per sub-entity with "View all" — not the full list.
- `CountBadge` on `TabsTrigger` orients users to how much is in each section.
- `attention` prop on `TabsTrigger` signals a section needs action before continuing.

---

## Consistency (Figma Principle 3)

**Rule:** Buttons, patterns, and flows must look and function identically everywhere.
When a pattern deviates, users stop to ask why — costing attention and trust.

**ERP application:**

- All entity lists use `CrudMainView` / `CrudTable`. No custom list UI per module.
- All create/edit flows use `EntityForm`. No custom field layouts per module.
- All status display uses `StatusBadge`. No local badge variants per module.
- All date display uses `DD.MM.YYYY`. No mixed locale formats.
- All empty states: `EmptyState` (page level) / `InlineEmptyState` (section level).
- All page-level destructive confirmations use `ConfirmActionDialog` or `AlertDialog`.

---

## Contrast (Figma Principle 4)

**Rule:** Use higher contrast for critical elements, neutral contrast for secondary.
Contrast directs attention — it must be intentional, not accidental.

**ERP application:**

- `text-foreground` for primary content. `text-muted-foreground` for secondary. Never reversed.
- `variant="destructive"` uses strong red — reserved for delete/irreversible only.
- `variant="ghost"` for toolbar/icon actions — low contrast because they are secondary.
- Don't use `variant="cta"` for actions that aren't the primary page intent.
- Icon contrast: icons paired with text should be slightly lower contrast than the label.

  ```tsx
  // ✅ Icon quieter than text
  <PlusIcon size={14} className="text-muted-foreground" />
  <span>Add party</span>

  // ❌ Icon same weight as text — competes visually
  <PlusIcon size={14} />
  <span>Add party</span>
  ```

---

## Proximity (Figma Principle 6)

**Rule:** Related controls sit close together. Unrelated elements have more space.
Spatial distance implies logical distance.

**ERP application:**

- Label and its input: `gap-1.5` (6px). Related.
- Fields within a section: `gap-4` (16px). Same domain, separate items.
- Between sections: `space-y-6` (24px). Different domains.
- Between page-level blocks: `space-y-4` (16px).
- Destructive button must be separated from the primary button — not adjacent.

  ```tsx
  // ✅ Destructive separated
  <div className="flex items-center gap-2">
    <Button variant="outline">Cancel</Button>
    <Button variant="cta">Save</Button>
  </div>
  <Button variant="destructive" className="mt-4">Delete record</Button>

  // ❌ Destructive adjacent to primary
  <div className="flex gap-2">
    <Button variant="cta">Save</Button>
    <Button variant="destructive">Delete</Button>
  </div>
  ```

- Logout / dangerous navigation should not sit beside frequently used module links in sidebar.

---

## Alignment (Figma Principle 7)

**Rule:** Implement a strong grid. Every element aligns to something.
Misalignment in dense software reduces trust and makes scanning harder.

**ERP application:**

- Page gutter from `APP_MAIN_GUTTER_CLASS` — never add extra outer padding inside a module.
- `EntityForm` grid: all labels align, all inputs align. Never mixed-width fields on the same row unless using `colSpan`.
- `DetailView` field labels align to the same left edge.
- `CrudTable` column headers and cell content align (text left, numbers right, dates consistently).
- `ListRow` leading / trailing elements align to the row's center axis (`items-center`).
- Page header: title left, primary action right — consistent across all modules.

---

## Hick's Law (Laws of UX)

**Rule:** Decision time increases with the number and complexity of choices.
Every additional option adds cognitive cost.

**ERP application:**

- `FilterToolbar`: show 3–4 key filters by default. Hide advanced filters behind an "Advanced" toggle.
- `Combobox` option lists: group items when count exceeds 8. Use `description` to reduce scanning effort.
- Sidebar: maximum 7 items per section (Miller's Law boundary).
- `DropdownMenu` row actions: 3 actions max visible. Move rare actions behind a separator or sub-menu.
- `StepperLayout`: 4–5 steps max. Split into separate flows if more are needed.
- Settings navigation: group settings into no more than 6 top-level categories.

---

## Fitts's Law (Laws of UX)

**Rule:** Acquisition time of a target = distance to target / size of target.
Small, far targets are hard to hit. Enlarge frequent targets; shrink rare ones.

**ERP application:**

- Minimum touch target: 44×44px. Our `h-9` = 36px — add `min-h-[44px]` on mobile where needed.
- Primary action button (`variant="cta"`, `size="lg"`, `h-10`) is the largest button on the page.
- Row actions: use `h-7 w-7` ghost buttons minimum — do not use `h-5`.
- Delete/destructive actions: deliberately smaller or behind overflow menu — making them harder to hit is intentional.
- Sidebar items: full-width clickable area (`flex w-full`), not just the text label.
- Modal cancel button should not be the same size as the primary confirm button.

---

## Miller's Law (Laws of UX)

**Rule:** Average person holds 7 (±2) items in working memory.
Chunk information into groups of 5–9.

**ERP application:**

- Sidebar sections: maximum 7 items per section. If more, add a section break.
- `StatCard` dashboard rows: 3–5 cards maximum per row.
- Form sections: 4–6 fields per section. More than 6 → use a new section or `CollapsibleSection`.
- `Tabs`: maximum 6 tabs. More than 6 → rethink information architecture.
- Table visible columns: 5–7. Additional columns behind column visibility toggle.
- `MultiSelect` options: group when exceeding 9. Always show a count of selected items.

---

## Serial Position Effect (Laws of UX)

**Rule:** Users best remember the first and last items in a sequence.
Middle items are least memorable and receive least attention.

**ERP application:**

- Sidebar: put the most-used modules first. Put settings and admin last.
- Page header actions: primary CTA rightmost (last, most prominent). Back/cancel leftmost.
- Form sections: put required/identity fields first. Put optional/advanced fields last.
- `StepperLayout`: put the most cognitively demanding step in the middle, not first or last.
- `CrudTable` columns: identity column first, actions column last. Status near the front.
- Tab order: Overview first (always), most important domain second, settings/admin last.

---

## Aesthetic-Usability Effect (Laws of UX)

**Rule:** Users perceive aesthetically pleasing design as more usable and reliable.
Visual polish is not decoration — it increases perceived correctness.

**ERP application:**

- A consistent shadow-sm on Level 2 cards creates perceived structure and stability.
- Grey page background (not white-on-white) makes content boundaries feel intentional.
- Consistent border opacity system (`border-border/60`, `border-border/40`) creates visual rhythm.
- Consistent spacing scale prevents the "misaligned" feeling that erodes trust.
- Typography hierarchy (one text-xl title, one CTA, muted meta) makes pages feel purposeful.
- Well-formatted MoneyText with tabular numerals signals financial precision.

---

## Nested Corner Radius (Anthony Hobday, Rule 24)

**Rule:** Inner corner radius = outer corner radius minus the gap between them.
If the gap is larger than the outer radius, the inner element should use 0 radius.

**ERP application:**

```
Outer card radius:    rounded-lg = 8px
Card padding:         p-4 = 16px (gap > radius)
→ Inner elements:     rounded-md = 6px (not rounded-lg)

SectionCard radius:   rounded-lg = 8px
SectionCard header/body divider: border-t (no radius needed)
Inner ListRow:        rounded-lg = 8px (same level, owns its border)

Dialog radius:        rounded-lg = 8px
Dialog inner cards:   DO NOT nest cards inside dialogs
```

Practical rule: inside a `Card` (rounded-lg), use `rounded-md` for inputs, buttons, and badges.
Do not use `rounded-lg` on elements inside a `rounded-lg` container unless they own their border.

---

## Icon-Text Contrast (Anthony Hobday, Rule 28)

**Rule:** When icons appear with text, lower the icon's contrast relative to the text.
An icon at the same contrast as text creates two competing anchors.

**ERP application:**

```tsx
// ✅ Icon quieter than label
<Button variant="cta" size="lg">
  <PlusIcon size={16} className="opacity-80" />
  New client
</Button>

// ✅ Icon in sidebar — already muted via text-muted-foreground
<Icon size={16} className="h-4 w-4 shrink-0" />

// ✅ Action menu icon
<EditIcon size={14} className="mr-2 text-muted-foreground" />
Edit

// ❌ Icon same weight as label
<PlusIcon size={16} />
<span className="font-medium">New client</span>
```

Icon-only buttons: full contrast is OK because the icon IS the content, not support.

---

## Adjacent Hard Divides (Anthony Hobday, Rule 25)

**Rule:** Do not place multiple visual boundaries next to each other.
Border next to separator next to background change = three signals for one boundary.

**ERP application:**

- One boundary method per relationship. Choose one: spacing OR divider OR background tint.
- Inside `SectionCard`: use `border-t border-border/40` for internal dividers — not border + background shift.
- `SettingsRow` already has its own border — do not put it inside another bordered container.
- Between `ListRow` items: use `space-y-2` — the rows' own borders are the boundary. No additional dividers.
- Form sections inside `EntityForm`: use section headings + spacing. Not card borders per section.
