# UI patterns

Task recipes. Core rules: [`ui-system.md`](./ui-system.md). Components: [`component-registry.md`](./component-registry.md).

---

## Module pattern {#module-pattern}

```
modules/<name>/
├── shared.tsx          # columns, formFields, defaults, status maps, header CTA, *PageIcon
├── <Name>sListPage.tsx # CrudMainView only
├── <Name>CreatePage.tsx
└── <Name>DetailPage.tsx
```

- `useListPageState()` for list state — don’t hand-roll filters/sort/page
- Config lives in `shared.tsx` — not inline in pages
- List: `entityLabel`, `getRowHref`, `exportOptions`, `headerActions`

---

## Page header {#page-header}

- **Left:** `icon` (required) → optional `backTo` → `title` + `subtitle` (status/tags here)
- **`actions`:** operational only — CTA, export, outline links, icon edit/delete
- **Never in `actions`:** `StatusBadge`, stage chips, duplicate status
- All header buttons: `size="sm"`; export icon-only (`PageHeaderExportButton`)
- Order: Export → secondary → CTA last
- Edit/delete: `IconEditButton` / `IconDeleteButton`, `aria-label`, no visible text

---

## Lists & CrudTable {#lists}

**Width:** `columnStretch="all"` (default); no horizontal scroll; `hideBelow` on secondary columns; don’t persist pixel widths when stretching.

**Alignment:** text/status/date left; currency/numbers right via `crudTableAlignClass`.

**Padding:** use `crudTableColumnPaddingClass` — first col `pl-5`, last `pr-5`; toolbar/pagination `px-5`.

**List CRUD (default on):** multiselect, row menu, bulk bar (`bg-sidebar-primary/[0.06]`). Opt out: `enableListCrud={false}`.

---

## Filter toolbar {#filter-toolbar}

**One horizontal row** — `FILTER_TOOLBAR_SLOT_COUNT = 3` fixed slots + search + reset.

```
minmax(8rem, 1.5fr) repeat(3, minmax(6.5rem, 1fr)) auto
```

Unused filter slots: empty `h-9` placeholder. Reset always reserves width (`invisible` when inactive).

---

## Combobox {#combobox}

All single-select: `<Combobox>` — forms, filters, settings. `EntityForm` `type: 'combobox'|'select'`.

Multi-select: `<MultiSelect>`. `clearable={false}` for required “All” filter rows.

---

## Settings rows {#settings-rows}

Shell: `AppSectionNavLayout` + `SettingsSection` / `SettingsRow` (see [`ui-system.md`](./ui-system.md)).

**Layout — one line, info left, control right.** Every simple field is an inline `SettingsRow`: label (+ optional `description`) on the left, a single control on the right. `align="start"` only for tall controls (`MultiSelect`, input with an error message). `layout="stacked"` is reserved for genuine multi-line controls (textarea) and table/list managers (catalogs, locations) — not for squeezing two controls onto one row.

**Pick the control — in this order:**

| Prefer      | Control                    | When                                                                             |
| ----------- | -------------------------- | -------------------------------------------------------------------------------- |
| 1. Toggle   | `Switch`                   | Boolean on/off                                                                   |
| 2. Dropdown | `Combobox`                 | Choice from a known/bounded set — incl. bounded numbers (percent, counts)        |
| 3. Field    | `NumberInput` / text input | Free-form value with no sensible preset set — **use sparingly**                  |
| 4. Slider   | `PercentSliderInput`       | **Last resort** — only when dragging a continuous range is genuinely the best UX |

- Default a bounded percentage/threshold to a **`Combobox` of presets**, not a slider or a free field.
- Single-select dropdown is always `Combobox`, never `Select` (hard ban, [`ui-system.md`](./ui-system.md)).
- Right-column widths come from `settingsForm.tsx` — `CONTROL_WIDTH` (selects), `SHORT_INPUT_WIDTH` (short/percent), `INPUT_WIDTH` (text) — so every control’s right edge lines up.

**Taller / multi-value controls — how they sit in a row:**

| Control                    | Layout                                                                |
| -------------------------- | --------------------------------------------------------------------- |
| `MultiSelect`              | inline `align="start"`, right column `INPUT_WIDTH`; chips wrap inside |
| `DatePicker` / date-range  | inline `align="start"` (popover trigger is control-height; align top) |
| `RadioGroup` (2–4 options) | inline `align="start"`; **>4 options → use a `Combobox` instead**     |
| `Textarea`                 | `layout="stacked"` (full-width below the label) — always              |
| Table/list manager         | `SettingsTable` full-width (own section, not a `SettingsRow`)         |

**Sections with an add/manage action:** `SettingsSection` has no action slot — render a header row (`<h3 className="text-sm font-semibold text-foreground">` to match `SettingsSection`) with the action `Button variant="outline" size="sm"` on the right, then the body below. Small catalogs use `SettingsTable` (its light border is sanctioned — do **not** hand-roll a bordered list).

---

## Entity form {#entity-form}

Always `<EntityForm>`. Surfaces: `page` (submit `default`) vs `dialog` (submit `cta`, `showHeader={false}` when parent has title).

- Sections for 4+ fields; `colSpan: 2` for wide fields
- Types: `combobox`, `country`, `currencySelect`, `vocabulary`, `radio`, `relation`, `phone`, `address`, …
- Errors: `errors` prop or field `error`; invalid ring via `FormField`
- Server validation contract: `{ fieldErrors: { 'path.to.field': 'message' }, formError?: 'top-level' }`; wrap submit handlers with `withFieldErrors(...)` when catching backend errors.
- Keystroke sanitization on number/currency/phone/email/url/postal — see registry `NumberInput` helpers

Don’t: raw inputs in page forms; `cta` on full-page submit; native date/select.

---

## Detail pages {#detail-pages}

| Workflow      | Pattern                    |
| ------------- | -------------------------- |
| Read record   | `DetailView` one scroll    |
| Many sections | `AppSectionNavLayout`      |
| Queue         | `SplitView` + `fillHeight` |
| Peer modes    | `Tabs` + `SectionCard`     |
| File inspect  | Preview-led `fillHeight`   |

**Never** `DetailView` inside `Tabs`.

**Overview tab (if tabs):** StatCards (≤6) → recent timeline → sub-entity previews (3–5 + “View all”).

**Sub-entities:** `SectionCard` + `ListRow`; add/edit `SubEntityFormDialog`; empty `InlineEmptyState`; checklists `ChecklistSection`.

Field `importance` + `CARD_CONTENT_TIERS` — see [`foundation.md`](./foundation.md).

---

## Section nav {#section-nav}

`MODULE_PAGE_SECTION_NAV_CLASS` + `AppSectionNavLayout` (not raw `SettingsLayout`).

- App sidebar auto-compacts; section nav + content scroll independently
- Active: `bg-sidebar-primary/10` + `text-sidebar-primary`
- No border/card around nav list
- Mobile: horizontal tab row above content

---

## Split view {#split-view}

```tsx
<SplitView className="min-h-0 flex-1 w-full" persistKey="…" sidebarScroll
  defaultSidebarWidth={400} minSidebarWidth={320} maxSidebarWidth={760} … />
```

- No border on split outer; pixels not `%` widths
- Queue: `SplitViewQueue` + `ListRow variant="queue"` + `QUEUE_ITEM_SELECTED_CLASS`
- Filters above split: shared `Tabs`, not button toggles
- Badges under title/meta — not in header `actions`

Fixed `min-h-[…]` only in showcase/dialogs — see [Fill height](#fill-height).

---

## Fill height {#fill-height}

`ModulePage fillHeight` + `MODULE_TABS_FILL_CLASS` when panes need independent scroll. Don’t wrap split in extra `overflow-y-auto`.

---

## Dialogs {#dialogs}

| Need        | Component                                      |
| ----------- | ---------------------------------------------- |
| Form modal  | `Dialog` + `EntityForm surface="dialog"`       |
| Footer      | `DialogFormFooter` confirmVariant="cta"        |
| Page delete | `ConfirmActionDialog` destructive              |
| Row delete  | `ConfirmPopover` or CrudTable built-in confirm |

Cancel: `ghost`. Save: `cta`. Toast via `@/lib/toast`.

---

## Status & money {#status-money}

Tables: `type: 'status'` + `meta.variantMap` (helper `statusColumn`). Reuse map in subtitle/detail.

Display: `<StatusBadge>`, `<MoneyText>` — never per-module formatters or colored `Badge`.

---

## Dates {#dates}

Display: `formatDisplayDate` / `formatDisplayDateTime` — `DD.MM.YYYY`. Input: `DatePicker` / EntityForm date types.

---

## Checklist {#checklist}

`<ChecklistSection items onToggle>` — done = checkbox + muted strikethrough + row opacity; `readOnly` on overview previews.

---

## Layouts {#layouts}

Import chrome from `@/components/common/pageChrome` (`FIELD_GROUP_LABEL_CLASS`, gutter classes).

**Blocks (compose, don’t reinvent):**

| Job             | Block                                |
| --------------- | ------------------------------------ |
| List            | `CrudMainView`                       |
| Record          | `DetailView` / section nav / split   |
| Form            | `EntityForm` / `SubEntityFormDialog` |
| Config table    | `SettingsTable`                      |
| Metrics         | `StatCard`, `ChartCard`              |
| Files           | `DocumentPreview`, `AttachmentList`  |
| Maps            | `GoogleMapsPreview`                  |
| Email workbench | `@/components/email` + `SplitView`   |
| Calendar        | `CalendarView` (`@oktavius/base-ui`) |
| Empty sub-list  | `InlineEmptyState`                   |

`SettingsTable` for small catalogs; `CrudMainView` for transactional lists.

---

## Component library map {#component-library}

Reusable UI lives in two packages — **never** copy module-only markup when a library export exists.

| Layer        | Path                | Use for                                                                     |
| ------------ | ------------------- | --------------------------------------------------------------------------- |
| **base-ui**  | `@oktavius/base-ui` | Primitives, `CalendarView`, `SplitView`, `EntityForm` field widgets, charts |
| **apps/web** | `@/components/*`    | ERP blocks: data, agent, **email**, maps, documents, pickers, layout        |

Import from the barrel (`@/components/email`, `@/components/maps/…`) or the registry — not from `modules/*/`.

---

## Calendar (base-ui) {#calendar}

**Import:** `@oktavius/base-ui` — `CalendarView`, `CalendarEventEditorDialog`, `CalendarMiniPicker`, types `CalendarEvent`, `CalendarSource`.

```tsx
<CalendarView
  anchor={anchor}
  onAnchorChange={setAnchor}
  view={view}
  onViewChange={setView}
  events={events}
  calendars={sources}
  showSidebar
  onEventClick={…}
  onSlotClick={…}
/>
```

- Sidebar jump-to-date: **`CalendarMiniPicker`** only — never raw `<Calendar classNames={…}>` ([`locked-components.md`](./locked-components.md))
- Prefer `CalendarView` over standalone `SchedulerView` / `AgendaList`
- Module route (`/calendar`) is thin glue — planner UI is library-owned

---

## Email (apps/web) {#email}

**Import:** `@/components/email` — composer, thread queue/detail, drafts helpers.

| Component                               | Use                                      |
| --------------------------------------- | ---------------------------------------- |
| `EmailComposer`                         | Rich-text compose (inline or `embedded`) |
| `EmailComposerDialog`                   | Reply / forward / new in modal           |
| `EmailThreadQueue`                      | Folder list + thread list (sidebar)      |
| `EmailThreadDetail`                     | Message stack + action bar               |
| `buildReplyDraft` / `buildForwardDraft` | Prefill from thread                      |
| `queueEmailSend`                        | Demo send pipeline                       |

Workbench shell (any module):

```tsx
<ModulePage fillHeight icon={…}>
  <SplitView persistKey="…" sidebar={<EmailThreadQueue … />}>
    <EmailThreadDetail … />
  </SplitView>
</ModulePage>
```

- Composer hidden until Reply/Forward/New — not permanent under every thread
- Pass `contactOptions` for address book; module keeps demo data / API wiring
- `RecipientCombobox` + `RichTextEditor` from base-ui — already composed inside `EmailComposer`
