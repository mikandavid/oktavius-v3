# OktaviusV3 Frontend — Agent Reference

Drop this file into any session to get full context on stack, component registry, visual rules, and patterns.

---

## Stack

| Concern | Library | Notes |
|---|---|---|
| Framework | React 19 + TypeScript | Vite, strict mode |
| Styling | Tailwind CSS v3 | CSS vars for theming, `tailwindcss-animate` |
| Icons | `@phosphor-icons/react` | **Import from `@/lib/icons` only** — never from the library directly |
| Data grid | `@1771technologies/lytenyte-core` | `CrudTable` wraps this — never use `Grid` directly |
| Date/time | `react-day-picker` v9 + `date-fns` v4 | `DatePicker` component handles all modes |
| Headless UI | Radix UI primitives | Wrapped in `@oktavius/base-ui` — never use Radix directly |
| Export | `xlsx` (lazy import) | `exportToXlsx()` from `@/components/data/exportGrid` |
| Routing | `react-router-dom` v7 | |
| Package manager | pnpm workspaces | `apps/web` + `packages/base-ui` |

---

## Workspace Structure

```
oktavius-v3/
├── apps/web/src/
│   ├── app/              # Router, providers, demo data
│   ├── components/
│   │   ├── common/       # PageLayout, BackButton, InfoBox, EmptyState, DetailView, ConfirmActionDialog
│   │   ├── data/         # CrudTable, CrudMainView, FilterToolbar, Pagination, exportGrid
│   │   └── forms/        # EntityForm (full field registry)
│   ├── components/feedback/  # StatusBadge
│   ├── components/layout/    # AppLayout, Sidebar, Header, MobileTopBar
│   ├── lib/
│   │   └── icons.ts      # All icon exports — use this, not @phosphor-icons/react
│   ├── modules/          # Feature modules (users/, …)
│   └── pages/            # ComponentShowcasePage (/showcase)
└── packages/base-ui/src/
    └── components/       # All shared primitives
```

---

## Icon Rules

**Always** import from `@/lib/icons`. Never from `@phosphor-icons/react` directly.

```tsx
// ✅ correct
import { PlusIcon, EditIcon, DeleteIcon, WarningIcon } from '@/lib/icons';

// ✅ dynamic (sidebar nav, module manifests)
import { icons, type IconName } from '@/lib/icons';
const Icon = icons[name];

// ❌ wrong
import { Plus } from '@phosphor-icons/react';
```

Common aliases: `PlusIcon` `EditIcon` `DeleteIcon` `BackIcon` `SearchIcon` `MoreIcon` `ExportIcon` `FilterIcon` `SortIcon` `SortAscIcon` `SortDescIcon` `SuccessIcon` `ErrorIcon` `WarningIcon` `InfoIcon` `SpinnerIcon` `ChevronDownIcon` `ChevronUpIcon` `ChevronLeftIcon` `ChevronRightIcon`

---

## Component Registry

### Page Structure

| Need | Component | Import |
|---|---|---|
| Full page with header + content | `<ModulePage>` | `@/components/common/PageLayout` |
| Page back navigation | `<BackButton>` | `@/components/common/BackButton` |
| Read-only record detail | `<DetailView>` | `@/components/common/DetailView` |
| Inline alert / tip / warning | `<InfoBox tone="info|success|warning|destructive">` | `@/components/common/InfoBox` |
| Empty list / zero state | `<EmptyState>` | `@/components/common/EmptyState` |
| Destructive confirm | `<ConfirmActionDialog>` | `@/components/common/ConfirmActionDialog` |

### Data / Tables

| Need | Component | Notes |
|---|---|---|
| Record list (any module) | `<CrudMainView>` | Header + filter toolbar + table + pagination + optional export |
| Table only | `<CrudTable>` | Lytenyte grid. Sortable, selectable, bulk actions, typed cells |
| Export to XLSX | `exportToXlsx(data, columns, fileName)` | `@/components/data/exportGrid` — lazy xlsx, no spinner needed |

**CrudMainView export** — pass `exportOptions`:
```tsx
<CrudMainView
  exportOptions={{ fileName: 'clients', label: 'Export' }}
  allRows={allClients}  // optional — full dataset, not just current page
  ...
/>
```

**CrudTable column types** — use `type` instead of `render` when possible:

| `type` | Renders |
|---|---|
| `text` (default) | Plain string |
| `status` | `StatusBadge` — maps value to color via `meta.variantMap` |
| `date` | Formatted date (MMM d, yyyy) |
| `currency` | Tabular number, symbol from `meta.currencySymbol` |
| `boolean` | Check or dash |
| `badge` | Outline `Badge` |

### Forms

Use `<EntityForm>` for all create/edit forms. `T extends Record<string, FormFieldValue>` where `FormFieldValue = string | boolean | number | string[] | null | undefined`.

**All EntityForm field types:**

| `type` | Value type | Use for |
|---|---|---|
| `text` | string | Names, titles, free text |
| `email` `url` `phone` | string | Contact fields |
| `number` | string | Integers, quantities (parse on submit) |
| `textarea` | string | Long text, notes |
| `select` | string | Short known option list (≤10 items) |
| `combobox` | string | Searchable dropdown, longer lists, async, create-new |
| `multiselect` | string[] | Multiple choice, tag-style display |
| `tags` | string[] | Free-form chips, Enter or comma to add |
| `checkbox` | boolean | Single boolean with label |
| `switch` | boolean | Toggle — enabled/disabled |
| `date` | string `"YYYY-MM-DD"` | Date only picker |
| `time` | string `"HH:mm"` | Time spinner |
| `datetime` | string `"YYYY-MM-DDTHH:mm"` | Date + time |
| `currency` | string | Number with currency prefix (`currencySymbol`) |

**Combobox advanced features:**
```tsx
// Async search
asyncItems={async (q) => fetchTeams(q)}

// Inline create
onCreate={{ label: '+ New team', onSubmit: async (label) => createTeam(label) }}

// Footer action
footerAction={{ label: 'Manage teams', onClick: () => navigate('/teams') }}
```

### Radix Primitives (base-ui)

| Component | When to use |
|---|---|
| `<Dialog>` `<DialogContent>` `<DialogHeader>` `<DialogTitle>` `<DialogDescription>` `<DialogFooter>` | Modal for forms, previews, multi-field confirms — more space than a popover |
| `<AlertDialog>` `<AlertDialogTrigger>` `<AlertDialogContent>` `<AlertDialogAction>` `<AlertDialogCancel>` | Blocking confirm modal — use for irreversible destructive actions. Lighter alternatives: `ConfirmPopover` (inline), `ConfirmActionDialog` (shared pattern) |
| `<DropdownMenu>` `<DropdownMenuTrigger>` `<DropdownMenuContent>` `<DropdownMenuItem>` `<DropdownMenuSeparator>` | Action menus (kebab menus, context menus). CrudTable row actions use this internally |
| `<Checkbox>` | Standalone binary input. In forms use EntityForm `checkbox` type instead |
| `<Textarea>` | Standalone multi-line text. In forms use EntityForm `textarea` type instead |
| `<Tooltip>` `<TooltipTrigger>` `<TooltipContent>` `<TooltipProvider>` | Hover labels on icon buttons, truncated text, abbreviations |
| `<ScrollArea>` | Bounded-height scrollable region with styled scrollbar |
| `<Separator>` | Horizontal (`h-px`) or vertical (`w-px`) divider line |

Wrap app in `<TooltipProvider>` once (already in AppLayout) — never add a second one per component.

### Display Atoms (base-ui)

| Component | When to use |
|---|---|
| `<Avatar label src size tone overlay>` | User/entity initials orb with optional image. sizes: `xs sm md lg`. tones: `muted accent primary` |
| `avatarInitials(label)` | Derive initials string from display name — use to keep display consistent |
| `<StatusDot tone size color>` | Colored dot for inline status, legend, presence |
| `<StatusDotLabel tone value>` | Dot + label, with optional bold leading value (counts) |
| `<CountBadge count hideZero max>` | Count chip for tab triggers, section headings, filter labels |
| `<CopyButton value label>` | Clipboard copy with auto-tooltip + check icon confirmation |
| `<ConfirmPopover trigger title onConfirm>` | Inline destructive confirm — lighter than full Dialog |
| `<DateRangePicker startValue endValue onStartChange onEndChange>` | Start + end date pair, auto-clamps min/max between fields |
| `<RelativeTime date withTitle>` | "3 days ago" / "in 2 hours" — activity feeds, timestamps, last-updated indicators. Shows absolute date on hover by default |
| `<MoneyText value currency locale compact>` | Currency display via Intl.NumberFormat. Tabular nums. `compact` gives 1.2K/3.4M notation. Defaults EUR / de-AT |
| `<AlertBanner tone dismissible onDismiss>` | Full-width page-top banner for maintenance notices, trial warnings, announcements. Different from InfoBox — sticky, banner placement |
| `<AttachmentList attachments onDelete onOpen isDeleting readOnly>` | File attachment list with icon detection, size formatting, open + delete actions |
| `<PageSkeleton>` | Full-page loading skeleton mirroring header + stat row + list. Use while async data loads |
| `<DetailSkeleton>` | Compact detail-page skeleton with field groups. Use on detail pages |

### Input Primitives (base-ui)

| Component | When to use |
|---|---|
| `<Input>` | Single-line text, email, number, url, phone |
| `<Textarea>` | Multi-line text |
| `<NumberInput value onChange decimals locale>` | Numeric input — thousands-separator formatting on blur, raw value to onChange. Use for amounts, quantities |
| `<Select>` | Short dropdown, no search |
| `<Combobox>` | Searchable dropdown, descriptions, async, create-new |
| `<MultiSelect>` | Multiple choice with checkbox list and badge display |
| `<TagsInput>` | Free-form chip entry (Enter/comma adds, Backspace removes) |
| `<Checkbox>` | Binary field, form or table selection |
| `<Switch>` | Enabled/disabled toggle, settings panels |
| `<DatePicker mode="date">` | Date only |
| `<DatePicker mode="time">` | Time spinner |
| `<DatePicker mode="datetime">` | Date + time, `minuteStep` prop |
| `<Badge>` | Status chip, label |
| `<Button>` | All actions |
| `<Skeleton>` | Loading placeholder |

### Section / Layout Primitives (base-ui)

| Component | When to use |
|---|---|
| `<SectionCard title actions meta>` | Content section inside a module detail page — replaces raw `Card` for sectioned content |
| `<ListRow title subtitle leading trailing variant onClick>` | Item rows within a section (parties, tasks, events) — NOT a data table |
| `<InlineEmptyState text centered>` | Dashed-border "no items yet" inside a SectionCard |
| `<CollapsibleSection title badge actions>` | Long workspace forms, optional field groups |
| `<Tabs>` `<TabsList>` `<TabsTrigger attention>` `<TabsContent>` | Complex entity detail pages with multiple workspace sections |
| `<SplitView sidebar sidebarWidth>` | Master-detail layout (list left, detail right) |
| `<SettingsLayout items activeKey onSelect>` | Settings page: nav sidebar + content panel |
| `<SettingsSection title description>` | Group of settings controls with heading |
| `<SettingsRow label description>` | Single settings control (label left, control right) |

**ListRow variants:** `default` · `muted` · `warning` · `dashed`

**Tabs attention dot:** Pass `attention` prop to `TabsTrigger` to show a warning dot (incomplete section, required fields).

### Data Display (base-ui)

| Component | When to use |
|---|---|
| `<StatCard label value delta trend icon>` | KPI / metric card on dashboards. `trend="up\|down\|neutral"` colors delta |
| `<Timeline events>` | Audit trail, activity feed, history on detail pages |
| `<Breadcrumb items>` | Navigation hierarchy above page title |
| `<InlineEdit value onSave>` | Click-to-edit single field in a DetailView row |

### Wizard / Multi-step (base-ui)

| Component | When to use |
|---|---|
| `<StepperLayout steps currentStep footer>` | Multi-step form wrapper — stepper header + content + footer buttons |
| `<Stepper steps currentStep>` | Standalone step indicator (use inside custom layouts) |

### Toast

```ts
// Import from @/lib/toast (re-exports sonner)
import { toast } from '@/lib/toast';

toast.success('Record saved.');
toast.error('Failed to save.');
toast.warning('Expires in 7 days.');
toast.info('3 items selected.');
toast.promise(asyncFn(), { loading: 'Saving…', success: 'Saved!', error: 'Failed.' });
```

Toaster is mounted in `AppLayout` — never add it yourself.

### Form field additions

| `type` | Value type | Notes |
|---|---|---|
| `relation` | string | Same as `combobox` but semantically an entity picker. Supports `asyncItems`, `onCreate`, `footerAction` |
| `file` | `File \| null` | Drag-and-drop file picker. Handle upload in `onSubmit`, not inside the form |

**`relation` field advanced props** (all also work on `combobox`):
```tsx
{
  type: 'relation',
  asyncItems: async (q) => searchClients(q),       // debounced async search
  onCreate: { label: '+ New client', onSubmit: async (label) => createClient(label) },
  footerAction: { label: 'Manage clients', onClick: () => navigate('/clients') },
}
```

### Button Variants

| Variant | When |
|---|---|
| `cta` | Primary page action (Create, Save) |
| `default` | Secondary confirmed action |
| `outline` | Toolbar actions, export, filters |
| `ghost` | Icon buttons, inline controls |
| `destructive` | Delete, irreversible actions |

### Status / Feedback

```tsx
<StatusBadge status="Active" />
// Override mapping:
<StatusBadge status="draft" variantMap={{ draft: 'warning', published: 'success' }} />
// Custom label:
<StatusBadge status="active" label="Live" />
```

---

## Visual Hierarchy Rules

### Date format standard
**Always display dates as DD.MM.YYYY** throughout the entire app. No `MMM d, yyyy`, no `MM/DD/YYYY`, no ISO display.

| Context | Format | Example |
|---|---|---|
| `DatePicker` display | `DD.MM.YYYY` | `15.03.2024` |
| `DatePicker` datetime display | `DD.MM.YYYY HH:mm` | `15.03.2024 14:30` |
| Table/list columns (`type: 'date'`) | `DD.MM.YYYY` | `15.03.2024` |
| `RelativeTime` tooltip | `DD.MM.YYYY` | hover shows `15.03.2024` |
| Internal ISO value (form state, API) | `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` | stays ISO, never shown to user |

`DatePicker` accepts typed input in DD.MM.YYYY, DD/MM/YYYY, and YYYY-MM-DD — always normalizes display to DD.MM.YYYY on blur.

### Input height standard
All single-line input controls must be **`h-9`** (36px): `Input`, `Select`, `Combobox`, `NumberInput`, `DatePicker`. Exception: `InlineEdit` uses `h-7` (compact inline context only).

### Button sizes
| size | height | use |
|---|---|---|
| `sm` | `h-7` | SectionCard actions, row-level controls, tight toolbars |
| `default` | `h-9` | Standard form actions — matches input height |
| `lg` | `h-10` | Primary page CTA (Create, Save) |
| `icon` | `h-9 w-9` | Icon-only buttons |

Button text is `text-sm` at all sizes except `sm` which uses `text-xs`.

### Design tokens — radius and shadow

All radius and shadow values are centralized in `globals.css` as CSS variables. Change once, all components update.

```
--radius-card: 0.75rem     →  rounded-card    — all surface containers
--radius-control: 0.5rem   →  rounded-control — inputs, buttons, filter pills
--radius-badge: 0.25rem    →  rounded-badge   — badges, chips
--shadow-card: subtle 1px  →  shadow-card     — Card, StatCard, unified table container
--shadow-elevated: deeper  →  shadow-elevated — dropdowns, popovers, dialogs
```

Always use semantic classes. Never use `rounded-lg` on named surfaces — use `rounded-card`.

| Surface | Classes |
|---|---|
| `Card` | `rounded-card border bg-card shadow-card` |
| `SectionCard` | `rounded-card border border-border/60 bg-background` |
| `StatCard` | `rounded-card border border-border bg-background shadow-card` |
| CrudMainView container | `rounded-card border border-border/70 bg-background shadow-card` |

### Section titles — no ALL-CAPS
`SectionCard` titles use `text-sm font-semibold text-foreground`. Never `uppercase tracking-widest` — it looks dated. Reserve ALL-CAPS only for `StatCard` labels (`text-xs font-medium text-muted-foreground` — compact KPI context).

### Whiteness hierarchy (closer = whiter)
The app uses elevation-through-brightness: the closer something is to the user (interactive), the whiter it is.

| Layer | Token / color | Example |
|---|---|---|
| App shell / page background | `hsl(0 0% 96.5%)` (body) | Main content area |
| Sidebar | `bg-sidebar-background` | Nav rail |
| Cards / panels / surfaces | `bg-background` (100% white) | `SectionCard`, `StatCard`, `Card`, `CollapsibleSection` |
| Interactive inputs | `bg-background` (100% white) | `Input`, `Select`, `Textarea`, `Combobox`, `NumberInput` |
| Hover / muted fills | `bg-muted` (93%) | Button hover, item hover states |

**Rule:** Never set a page-level or layout-level container to `bg-background`. White is reserved for surfaces and interactive elements. Let layout containers inherit the grey body background.

### No cards-in-cards
Page surfaces can be bordered containers. Internal grouping uses:
- Section headings (`text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground`)
- Dividers (`border-t border-border/70`)
- Spacing (`space-y-4`)

Never nest `<Card>` inside `<Card>`. Use `<SectionCard>` for content sections inside module detail pages — it provides consistent border chrome without violating the nesting rule.

### Border opacity system
| Token | Use |
|---|---|
| `border-border` | Full weight — page-level Card, outer containers (`--border` = 88% lightness) |
| `border-border/70` | Section dividers inside EntityForm/DetailView |
| `border-border/60` | SectionCard shells, ListRow borders |
| `border-border/50` | Muted ListRow, inner sub-cards |
| `border-border/40` | Dividers *inside* SectionCard (e.g. header–body separator) |
| `border-dashed border-border/60` | InlineEmptyState, ListRow variant `dashed` |

### Detail page patterns
- **Simple entity** (users, contacts): `ModulePage` + `DetailView` — flat sections in one scroll.
- **Complex entity / workspace** (cases, projects, clients with sub-entities): `ModulePage` + `Tabs` — each tab contains one or more `SectionCard` components.
- Within tabs, use `ListRow` for sub-entity lists (parties, tasks, attachments). Use `CrudTable` only for independently sortable/paginated datasets.

### Inline empty state vs page empty state
- `<EmptyState>` — page-level, full-width, centered. When a whole module/list has no records.
- `<InlineEmptyState>` — compact dashed border, inside a `SectionCard`. When a sub-list within a detail page has no items.

### Entity overview tab pattern
Complex entities (cases, projects, clients with sub-entities) use an **Overview** tab as the first tab. Structure:
1. `StatCard` row — key metrics (parties count, events, documents, completion %)
2. `SectionCard` "Recent Activity" — `Timeline` with audit trail events
3. `SectionCard` for each major sub-entity group — `ListRow` items with avatars, role badges, add button in header

Never put the full sub-entity list on the overview tab. Show top 3–5 items with a "View all" link to the dedicated tab.

### Sub-entity management pattern (SectionCard + modal)
For managing sub-entity lists (parties, tasks, checklist items) inside a detail page:
1. `SectionCard` with title + `<Button size="sm" variant="outline">Add</Button>` in `actions`
2. `ListRow` per item with `<Avatar>`, title, subtitle, trailing delete/edit ghost buttons
3. `<InlineEmptyState>` when list is empty
4. Add/edit opens a `<Dialog>` containing an `<EntityForm>` — never inline editing in the row

### Page loading states
- Use `<PageSkeleton>` as the default loading state on list pages while async data loads
- Use `<DetailSkeleton>` on detail pages
- Never use bare `<Skeleton>` lines at page level — compose via PageSkeleton/DetailSkeleton

### AlertBanner placement
- Mount `<AlertBanner>` above the page `<ModulePage>` wrapper, not inside it, so it spans full width
- Use for persistent notices (trial expiry, maintenance) — not for transient action feedback (use `toast` for that)
- Persist dismissal to localStorage / user preference so it stays dismissed across navigations

### Density
- Tables: 44px rows (38px compact)
- Forms: 2-column grid by default, `colSpan: 2` for wide fields
- Body text: `text-sm`. Labels: `text-sm font-medium`. Meta: `text-xs text-muted-foreground`

### Typography scale
- Page title: `text-xl font-semibold` (via `ModulePage`)
- Section heading: `text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground`
- Card title: `CardTitle` component
- Body: `text-sm`
- Muted/meta: `text-xs text-muted-foreground`

### Colors — use semantic tokens only
| Token | Use |
|---|---|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / meta |
| `bg-background` | Page / card background |
| `bg-muted` / `bg-muted/40` | Subtle fills, hover states |
| `border-border` | Default borders |
| `border-border/70` | Section dividers |
| `text-destructive` | Errors, delete |
| `text-success` / `text-warning` / `text-info` | Status colors |

---

## Module Pattern

Each ERP module in `apps/web/src/modules/<name>/`:

```
clients/
├── ClientsListPage.tsx    # CrudMainView — filter, sort, paginate, export
├── ClientCreatePage.tsx   # ModulePage + EntityForm
├── ClientDetailPage.tsx   # ModulePage + DetailView + action buttons
└── shared.tsx             # columns (CrudColumn[]), formFields (FormField[]), header actions
```

**List page sort state:** single `sort` string — `"field"` for asc, `"-field"` for desc. Pass to `CrudMainView` and sort data before passing `rows`.

**Detail page:** Use `DetailView` with sections. Never build custom field-row layouts.

**Form page:** All fields go through `EntityForm`. Group logically via `section`. Boolean fields (checkbox/switch) skip the outer `<Label>` — label is inline with the control.

---

## Dev Commands

```bash
cd oktavius-v3
pnpm install
pnpm dev          # http://localhost:5173
```

Key routes: `/dashboard` `/showcase` `/users` `/users/new` `/users/:id` `/clients` `/clients/new` `/clients/:clientId`

---

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Import icons from `@/lib/icons` | Import from `@phosphor-icons/react` directly |
| Use `CrudTable` / `CrudMainView` for all data grids | Build custom `<table>` layouts |
| Use `EntityForm` with field registry | Build one-off form layouts |
| Use `DatePicker` with `mode` prop | Use `<input type="date">` natively |
| Use `Combobox` for searchable selects | Use `<select>` for long lists |
| Use `MultiSelect` for multiple choice | Multiple checkboxes scattered in form |
| Use `TagsInput` for free-form arrays | Comma-separated text fields |
| Add `exportOptions` to `CrudMainView` | Wire export separately per module |
| Group form fields by `section` | Flat long single-section forms |
| Use semantic color tokens | Hard-code `text-gray-500`, `bg-white` |
| Use `StatusBadge` for all status rendering | Inline ad-hoc badge per module |
| Use `ModulePage` for every route | Custom page shells per module |
| Use `SectionCard` for detail page content sections | Nest `<Card>` inside page `<Card>` |
| Use `ListRow` for sub-entity item lists | Build custom bordered div rows per module |
| Use `InlineEmptyState` inside `SectionCard` | Custom "no items" paragraph styling |
| Use `CollapsibleSection` for long/optional field groups | Always-expanded long forms |
| Use `Tabs` for complex entity workspace pages | Multiple stacked accordion-style cards |
| Use `border-border/60` for section card borders | `border-border` (too heavy) or `border-gray-*` |
| Use `StatCard` for all KPI / metric displays | Custom div per module |
| Use `Timeline` for audit trail and activity | Custom list markup per module |
| Use `toast` from `@/lib/toast` for action feedback | `alert()`, inline banners for transient messages |
| Use `StepperLayout` for multi-step creation flows | Accordion or tab abuse for wizards |
| Use `SplitView` for master-detail pages | Custom flex layout per module |
| Use `SettingsLayout` + `SettingsRow` for settings pages | Custom settings layout per module |
| Use `InlineEdit` for click-to-edit in detail views | Full form modal for single-field edits |
| Use `relation` field type for entity pickers | Custom combobox wiring per form |
| Use `file` field type for document attachment | Raw `<input type="file">` per module |
| Use `Dialog` for form modals + large confirms | `window.confirm()` or custom overlay |
| Use `Tooltip` on all icon-only buttons | `title` attribute |
| Use `Avatar` for all user/entity initials | Ad-hoc `rounded-full bg-muted` divs per module |
| Use `StatusDot` / `StatusDotLabel` for inline status | Inline colored spans per module |
| Use `CountBadge` beside section titles and tab triggers | Raw `<Badge>{count}</Badge>` per module |
| Use `CopyButton` for clipboard actions | Custom copy logic per module |
| Use `ConfirmPopover` for row-level destructive actions | `ConfirmActionDialog` for inline deletes |
| Use `DateRangePicker` for start+end date fields | Two unconnected DatePicker instances |
| Use `ScrollArea` for bounded-height panels | `overflow-y-auto` without styled scrollbar |
| Use `NumberInput` for numeric fields needing thousands formatting | `<Input type="number">` for display-formatted amounts |
| Use `MoneyText` for all currency display | Ad-hoc `Intl.NumberFormat` calls per component |
| Use `RelativeTime` for timestamps in feeds and detail views | `date.toLocaleDateString()` inline per component |
| Use `AlertBanner` for page-top persistent notices | `InfoBox` for site-wide banners |
| Use `AttachmentList` for all file attachment displays | Custom file list markup per module |
| Use `PageSkeleton` / `DetailSkeleton` for page load states | Bare `<Skeleton>` lines scattered at page level |
| Lead complex entity detail pages with an Overview tab (stats + timeline + party summary) | Start directly on the first data tab |
| Use `Dialog` + `EntityForm` for sub-entity add/edit (parties, tasks) | Inline editing rows or custom modal markup per module |
| Keep base-ui component APIs variant-based (`variant`, `size`, `tone`) | Add `*ClassName` / `triggerClassName` / `contentClassName` escape-hatch props to base-ui components |
| Use `<TooltipProvider>` once (already in `AppLayout`) | Add `<TooltipProvider>` inside individual components |
