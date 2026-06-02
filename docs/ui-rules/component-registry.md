# OktaviusV3 Frontend — Agent Reference

Drop this file into any session to get full context on stack, component registry, visual rules, and patterns.

**Index:** [`README.md`](./README.md). **Core rules:** [`ui-system.md`](./ui-system.md). Topic files cover headers, tables, forms, modules, detail pages, checklists, status/money, dialogs, dates, combobox, split-view, calendar. Prefer rules in this folder over improvising UI.

---

## Stack

| Concern         | Library                               | Notes                                                                |
| --------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Framework       | React 19 + TypeScript                 | Vite, strict mode                                                    |
| Styling         | Tailwind CSS v3                       | CSS vars for theming, `tailwindcss-animate`                          |
| Icons           | `@phosphor-icons/react`               | **Import from `@/lib/icons` only** — never from the library directly |
| Data grid       | `@1771technologies/lytenyte-core`     | `CrudTable` wraps this — never use `Grid` directly                   |
| Date/time       | `react-day-picker` v9 + `date-fns` v4 | `DatePicker` component handles all modes                             |
| Headless UI     | Radix UI primitives                   | Wrapped in `@oktavius/base-ui` — never use Radix directly            |
| Export          | `xlsx` (lazy import)                  | `exportToXlsx()` from `@/components/data/exportGrid`                 |
| Routing         | `react-router-dom` v7                 |                                                                      |
| Package manager | pnpm workspaces                       | `apps/web` + `packages/base-ui`                                      |

---

## Workspace Structure

```
oktavius-v3/
├── apps/web/src/
│   ├── app/              # Router, providers, demo data
│   ├── components/
│   │   ├── command/      # CommandPalette (⌘K global search)
│   │   ├── common/       # PageLayout, BackButton, InfoBox, EmptyState, DetailView, FormattedText
│   │   ├── data/         # CrudTable, CrudMainView, BulkImportWizard, TreeList, exportGrid
│   │   ├── documents/    # DocumentPreview, DocumentPreviewPanel, PdfPreviewPanel
│   │   ├── agent/        # AgentMessageList, result cards, chat shell utilities
│   │   ├── maps/         # GoogleMapsPreview, GoogleMapsDialog, googleMapsEmbed
│   │   ├── pickers/      # EntityPicker, ContactPicker, ProjectPicker
│   │   ├── reports/      # ReportBuilderPanel
│   │   ├── workflow/     # CommentsPanel, MentionComposer, approvals, TaskInbox
│   │   └── forms/        # EntityForm (full field registry)
│   ├── components/feedback/  # StatusBadge
│   ├── components/layout/    # AppLayout, Sidebar, Header, HeaderAccountMenu, NotificationPanel, MobileTopBar
│   ├── lib/
│   │   └── icons.ts      # All icon exports — use this, not @phosphor-icons/react
│   ├── modules/          # Feature modules (users/, …)
│   └── pages/            # ComponentShowcasePage (/showcase)
└── packages/base-ui/src/
    └── components/       # All shared primitives
```

---

## App shell (fixed three-pane layout)

Desktop layout is always **nav left · workspace center · agent chat right**:

```text
| Sidebar (md+) | Header + main scroll | AIChatSidebar (lg+) |
```

Rules:

- **Never** hide the left nav on desktop — `Sidebar` is `md:flex`; mobile uses a drawer overlay.
- **Section-nav pages** — app sidebar auto-compacts to icon rail while `<AppSectionNavLayout>` is mounted; section nav and content scroll independently; main uses `APP_MAIN_FIT_CLASS`. See [`section-nav.md`](./section-nav.md).
- **Sidebar active item** — `bg-sidebar-primary/10` + `text-sidebar-primary`. Never use `bg-accent` on nav rows (Showcase Token Editor can set `--accent` to solid purple).
- **Chat rail** mounts on every route except `/ai-chat` (that route uses the full center column for chat).
- **Center column** scrolls (`APP_MAIN_SCROLL_CLASS` + gutter); fitted routes like `/ai-chat` use `APP_MAIN_FIT_CLASS` (no double scroll).
- **Shell background** is grey (`bg-muted/40` on body and main); modules use white `bg-card` surfaces.
- **Borders** separate panes (`border-r` on workspace, `border-l` on chat) — not shadows on rails.
- Chat width is persisted and exposed as `--app-ai-chat-sidebar-width` on `<html>` (48px collapsed).
- Below `lg`, chat moves to `/ai-chat` (mobile top bar bot icon). Do not build pages that assume full viewport width.

Import shell classes from `@/components/common/pageChrome`.

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

| Need                                 | Component                                                                  | Import                                                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Full page with header + content      | `<ModulePage>`                                                             | `@/components/common/PageLayout` — **always** pass `icon` (`*PageIcon()` from `@/lib/modulePageIcons`)                               |
| List page (CRUD)                     | `<CrudMainView>`                                                           | Same header — pass `icon={clientsPageIcon()}` etc. from module `shared.tsx`                                                          |
| Page back navigation                 | `<BackButton>`                                                             | `@/components/common/BackButton`                                                                                                     |
| Record Edit / Delete (page header)   | `<IconEditButton>` `<IconDeleteButton>`                                    | `@/components/common/RecordIconButtons` — icon-only, `aria-label`, no visible text                                                   |
| List header CTA / Export / secondary | `<PageHeaderExportButton>` `<PageHeaderCtaLink>` `<PageHeaderOutlineLink>` | `@/components/common/PageHeaderButtons` — all `size="sm"` (h-7); Export icon-only                                                    |
| Read-only record detail              | `<DetailView>`                                                             | `@/components/common/DetailView`                                                                                                     |
| Inline alert / tip / warning         | `<InfoBox tone="info \| success \| warning \| destructive">`               | `@/components/common/InfoBox`                                                                                                        |
| Empty list / zero state              | `<EmptyState>`                                                             | `@/components/common/EmptyState`                                                                                                     |
| Destructive confirm                  | `<ConfirmActionDialog>`                                                    | `@/components/common/ConfirmActionDialog`                                                                                            |
| Sub-entity add/edit dialog           | `<SubEntityFormDialog>`                                                    | `@/components/common/SubEntityFormDialog` — Dialog + EntityForm `surface="dialog"`                                                   |
| Tick-off checklist                   | `<ChecklistSection>`                                                       | `@/components/common/ChecklistSection` — checkbox + muted strikethrough label when done; `onToggle`; `readOnly` for overview preview |
| Dialog Cancel + Save footer          | `<DialogFormFooter>`                                                       | `@/components/common/DialogFormFooter` — ghost Cancel + purple confirm                                                               |

### Data / Tables

| Need                     | Component                               | Notes                                                                                                                                                |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Record list (any module) | `<CrudMainView>`                        | Header + filter toolbar + table + pagination + optional export                                                                                       |
| List page state hook     | `useListPageState()`                    | `@/lib/useListPageState` — search, filters, sort, pagination for `CrudMainView`                                                                      |
| Status table column      | `statusColumn(key, header, variantMap)` | `@/components/data/columns` — declarative `type: 'status'` column                                                                                    |
| Table only               | `<CrudTable>`                           | Lytenyte grid. Sortable, selectable, bulk actions, typed cells. List views use `columnStretch="all"` (via `CrudMainView`) so columns fill card width |
| Export to XLSX           | `exportToXlsx(data, columns, fileName)` | `@/components/data/exportGrid` — lazy xlsx, no spinner needed                                                                                        |

**CrudMainView layout** — card and `FilterToolbar` are `w-full max-w-full`. Filter toolbar stays **one row** with **3 fixed filter slots** (`FILTER_TOOLBAR_SLOT_COUNT`) so comboboxes do not shift between list pages. `CrudTable` uses `columnStretch="all"` + `columnSizeToFit` inside `.crud-table-host` (do not persist pixel widths — only order/hide/pin). Workspace main uses `overflow-x-hidden` so tables never widen the page.

**CrudTable cell padding** — use `crudTableColumnPaddingClass` from `crudTableDensity` (first column `pl-5`, last column `pr-5`, default `pl-4 pr-4`, actions `pr-5`). Filter toolbar + pagination use `px-5`. Do not use `px-2` on grid cells.

**List CRUD** — on `CrudMainView`, pass `entityLabel` + `getRowHref` for multiselect, row Edit/Delete menu, and bulk Edit/Delete bar (`standardListCrud.tsx`). Opt out with `enableListCrud={false}`.

**CrudMainView export** — pass `exportOptions`:

```tsx
<CrudMainView
  exportOptions={{ fileName: 'clients', label: 'Export' }}
  allRows={allClients}  // optional — full dataset, not just current page
  ...
/>
```

**CrudTable column types** — use `type` instead of `render` when possible:

| `type`           | Renders                                                   |
| ---------------- | --------------------------------------------------------- |
| `text` (default) | Plain string                                              |
| `status`         | `StatusBadge` — maps value to color via `meta.variantMap` |
| `date`           | `formatDisplayDate` — `DD.MM.YYYY`                        |
| `currency`       | Tabular number, symbol from `meta.currencySymbol`         |
| `boolean`        | Check or dash                                             |
| `badge`          | Outline `Badge`                                           |

### Forms

Use `<EntityForm>` for all create/edit forms. `T extends Record<string, FormFieldValue>` where `FormFieldValue = string | boolean | number | string[] | null | undefined`.

**All EntityForm field types:**

| `type`                | Value type                  | Use for                                                    |
| --------------------- | --------------------------- | ---------------------------------------------------------- |
| `text`                | string                      | Names, titles, free text                                   |
| `email` `url` `phone` | string                      | Contact fields                                             |
| `number`              | string                      | Integers, quantities (parse on submit)                     |
| `textarea`            | string                      | Long text, notes                                           |
| `select`              | string                      | Renders **Combobox** (alias — same as `combobox`)          |
| `combobox`            | string                      | Searchable single-select; async, create-new, footer action |
| `multiselect`         | string[]                    | Multiple choice, tag-style display                         |
| `tags`                | string[]                    | Free-form chips, Enter or comma to add                     |
| `checkbox`            | boolean                     | Single boolean with label                                  |
| `switch`              | boolean                     | Toggle — enabled/disabled                                  |
| `date`                | string `"YYYY-MM-DD"`       | Date only picker                                           |
| `time`                | string `"HH:mm"`            | Time spinner                                               |
| `datetime`            | string `"YYYY-MM-DDTHH:mm"` | Date + time                                                |
| `currency`            | string                      | Number with currency prefix (`currencySymbol`)             |

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

| Component                                                                                                       | When to use                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `<Dialog>` `<DialogContent>` `<DialogHeader>` `<DialogTitle>` `<DialogDescription>` `<DialogFooter>`            | Modal for forms, previews, multi-field confirms — more space than a popover                                                      |
| `<AlertDialog>` … `<AlertDialogAction variant="cta\|destructive">`                                              | Blocking confirm — `cta` default for primary confirm, `destructive` for delete. Lighter: `ConfirmPopover`, `ConfirmActionDialog` |
| `<DropdownMenu>` `<DropdownMenuTrigger>` `<DropdownMenuContent>` `<DropdownMenuItem>` `<DropdownMenuSeparator>` | Action menus (kebab menus, context menus). CrudTable row actions use this internally                                             |
| `<Checkbox>`                                                                                                    | Standalone binary input. In forms use EntityForm `checkbox` type instead                                                         |
| `<Textarea>`                                                                                                    | Standalone multi-line text. In forms use EntityForm `textarea` type instead                                                      |
| `<MouseTooltip content={<>…</>}>`                                                                               | Cursor-following tooltip — wraps any element, tracks mouse SE. Use for all hover labels.                                         |
| `<ScrollArea>`                                                                                                  | Bounded-height scrollable region with styled scrollbar                                                                           |
| `<Separator>`                                                                                                   | Horizontal (`h-px`) or vertical (`w-px`) divider line                                                                            |

### Display Atoms (base-ui)

| Component                                                          | When to use                                                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `<Avatar label src size tone icon overlay>`                        | User/entity orb — photo when `src` set; `icon` fallback (default person silhouette). Never initials                                  |
| `<StatusDot tone size color>`                                      | Colored dot for inline status, legend, presence                                                                                      |
| `<StatusDotLabel tone value>`                                      | Dot + label, with optional bold leading value (counts)                                                                               |
| `<CountBadge count hideZero max>`                                  | Count chip for tab triggers, section headings, filter labels                                                                         |
| `<CopyButton value label>`                                         | Clipboard copy with auto-tooltip + check icon confirmation                                                                           |
| `<ConfirmPopover trigger title onConfirm>`                         | Inline destructive confirm — lighter than full Dialog                                                                                |
| `<DateRangePicker startValue endValue onStartChange onEndChange>`  | Start + end date pair, auto-clamps min/max between fields                                                                            |
| `<RelativeTime date withTitle>`                                    | "3 days ago" / "in 2 hours" — tooltip uses `DD.MM.YYYY HH:mm`                                                                        |
| `formatDisplayDate` / `formatDisplayDateTime`                      | `@oktavius/base-ui` — **all** visible dates (`18.12.2024`); never `toLocaleDateString` in modules                                    |
| `<MoneyText value currency locale compact>`                        | Currency display via Intl.NumberFormat. Tabular nums. `compact` gives 1.2K/3.4M notation. Defaults EUR / de-AT                       |
| `<AlertBanner tone dismissible onDismiss>`                         | Full-width page-top banner for maintenance notices, trial warnings, announcements. Different from InfoBox — sticky, banner placement |
| `<AttachmentList attachments onDelete onOpen isDeleting readOnly>` | File attachment list with icon detection, size formatting, open + delete actions                                                     |
| `<PageSkeleton>`                                                   | Full-page loading skeleton mirroring header + stat row + list. Use while async data loads                                            |
| `<DetailSkeleton>`                                                 | Compact detail-page skeleton with field groups. Use on detail pages                                                                  |

### Input Primitives (base-ui)

| Component                                      | When to use                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `<Input>`                                      | Single-line text, email, number, url, phone — states via `FormField error`, optional `valid`                                |
| `<Textarea>`                                   | Multi-line text — same validation states as Input                                                                           |
| `<NumberInput value onChange decimals locale>` | Numeric input — thousands-separator formatting on blur, raw value to onChange. Validation via `invalid` / `validationState` |
| `<Combobox>`                                   | **All** single-select dropdowns. `isLoading`, `invalid`, optional `valid`                                                   |
| `<FormField id label error valid>`             | Label + control wrapper — forwards invalid/valid chrome to child                                                            |
| `<Button loading>`                             | Actions — `loading` sets spinner, disabled, `aria-busy`                                                                     |
| ~~`<Select>`~~                                 | **Do not use in `apps/web`** — legacy Radix select only                                                                     |
| `<MultiSelect>`                                | Multiple choice with checkbox list and badge display                                                                        |
| `<TagsInput>`                                  | Free-form chip entry (Enter/comma adds, Backspace removes)                                                                  |
| `<Checkbox>`                                   | Binary field, form or table selection                                                                                       |
| `<Switch>`                                     | Enabled/disabled toggle, settings panels                                                                                    |
| `<DatePicker mode="date">`                     | Date only                                                                                                                   |
| `<DatePicker mode="time">`                     | Time spinner                                                                                                                |
| `<DatePicker mode="datetime">`                 | Date + time, `minuteStep` prop                                                                                              |
| `<Badge>`                                      | Status chip, label                                                                                                          |
| `<Button>`                                     | All actions — use `loading` for async, not manual spinners                                                                  |
| `<Skeleton>`                                   | Loading placeholder                                                                                                         |

### Section / Layout Primitives (base-ui)

| Component                                                        | When to use                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `<SectionCard title actions meta>`                               | Borderless content section inside a module detail page — heading + bottom rule, no card chrome                              |
| `<ListRow title subtitle meta leading trailing variant onClick>` | Item rows within a section (parties, tasks, events) — NOT a data table. `meta` = tier-6 IDs/timestamps                      |
| `<InlineEmptyState text centered>`                               | Dashed-border "no items yet" inside a SectionCard                                                                           |
| `<CollapsibleSection title badge actions>`                       | Long workspace forms, optional field groups                                                                                 |
| `<Tabs>` `<TabsList>` `<TabsTrigger attention>` `<TabsContent>`  | Detail workspaces with peer work modes; not the default for many ordinary sections                                          |
| `<SplitView sidebar persistKey defaultSidebarWidth>`             | Resizable master-detail layout (list left, detail right) — always `w-full` on the split container                           |
| `<SplitViewQueue>` + `ListRow variant="queue"`                   | Spaced sidebar queue (`gap-2 p-3`), not stacked `border-b` rows                                                             |
| `<SettingsLayout items activeKey onSelect>`                      | Section nav + content panel (base-ui). In `apps/web` use `<AppSectionNavLayout>` — compacts app sidebar, independent scroll |
| `<SettingsSection title description>`                            | Group of settings controls with heading                                                                                     |
| `<SettingsRow label description>`                                | Single settings control (label left, control right)                                                                         |

**ListRow variants:** `default` · `muted` · `warning` · `dashed` · `queue` (master-detail sidebar cards — use inside `<SplitViewQueue>`)

### Master-detail (`SplitView`) pattern

- **Container:** `<SplitView className="w-full min-h-[…]" persistKey="…" defaultSidebarWidth={400} minSidebarWidth={320}>` — fills module width; draggable separator; optional `localStorage` persistence. Width props are pixels, not percentages.
- **Sidebar queue:** Wrap items in `<SplitViewQueue>` from `@/components/common/SplitViewQueue`. Each item is `<ListRow variant="queue" onClick={…}>` with `gap-2` between cards — never `divide-y` or `p-1` stacks of border-bottom rows.
- **Selection:** `QUEUE_ITEM_SELECTED_CLASS` — muted background only; no ring or left accent bar.
- **Detail header:** Title + meta line; **status/severity badges below meta**, not in a top-right `actions` cluster (same rule as `ModulePage` headers).
- **Queue filters:** Use `<Tabs>` / `<TabsList>` for Open/All-style filters above the split, not ad-hoc `Button` pairs.

**Tabs attention dot:** Pass `attention` prop to `TabsTrigger` to show a warning dot (incomplete section, required fields).

### Data Display (base-ui)

| Component                                 | When to use                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `<StatCard label value delta trend icon>` | KPI / metric card. Use inside `STAT_CARD_GRID_CLASS` — max 6 per row, fixed min-height |
| `STAT_CARD_GRID_CLASS`                    | Responsive grid: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`                           |
| `CARD_CONTENT_TIERS`                      | Six fixed typography tiers for card interiors — import from `@oktavius/base-ui`        |
| `RecordInfoHero` / `RecordInfoMeta`       | Primary hero row + meta footer strip for detail fields                                 |
| `RecordVisual` / `RecordIdentity`         | Logo, avatar, or icon anchor + hero title band on record cards                         |
| `DetailFieldGrid`                         | Default two-column field grid with tier-3/4 typography                                 |
| `<ChartCard title type data>`             | SectionCard + line/bar chart for module dashboards                                     |
| `<KanbanBoard columns renderCard>`        | Pipeline boards — CRM stages, procurement, cases                                       |
| `<SettingsTable columns rows>`            | Compact admin/catalog rows (lighter than CrudTable)                                    |
| `<Timeline events>`                       | Audit trail, activity feed, history on detail pages                                    |
| `<Breadcrumb items>`                      | Navigation hierarchy above page title                                                  |
| `<InlineEdit value onSave>`               | Click-to-edit single field in a DetailView row                                         |

### Wizard / Multi-step (base-ui)

| Component                                                          | When to use                                                                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `<StepperLayout steps currentStep footer>`                         | Multi-step form wrapper — stepper header + content + footer buttons                                                        |
| `<Stepper steps currentStep>`                                      | Standalone step indicator (use inside custom layouts)                                                                      |
| `<CommandDialog>` + cmdk primitives                                | Global command palette — wrap app in `CommandPaletteProvider`                                                              |
| `<RichTextEditor>`                                                 | Internal notes / long text in detail tabs                                                                                  |
| `<SimpleLineChart>` `<SimpleBarChart>` `<SimpleAreaChart>`         | Dashboard KPI charts (recharts)                                                                                            |
| `<SimpleMultiLineChart>` `<SimpleComboChart>` `<SimpleRadarChart>` | Multi-series and comparison charts                                                                                         |
| `<SimpleHorizontalBarChart>` `<SimpleSparklineChart>`              | Rankings and inline StatCard trends                                                                                        |
| `<ChartCard type="…">`                                             | Wrapped chart tile — line, area, bar, pie, stacked-bar, gauge, funnel, multi-line, combo, horizontal-bar, radar, sparkline |
| `CHART_PALETTE` / `resolveChartColor()`                            | `@oktavius/base-ui` — curated 8-color viz palette                                                                          |
| `<CalendarMonthPreview>`                                           | Static month grid for scheduling UI mock (legacy — prefer `CalendarView`)                                                  |

### Calendar / Planning (base-ui)

| Component                | When to use                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `<CalendarView>`         | **Primary planner** — Day / Week / Month / Schedule with toolbar, colors, time grid, sidebar                         |
| `<CalendarSidebar>`      | Left panel — team filters, calendar legend, jump-to-date (via `CalendarView showSidebar`)                            |
| `<CalendarMiniPicker>`   | **Compact month grid** — sidebar jump-to-date; styling locked — see [`locked-components.md`](./locked-components.md) |
| `<CalendarViewSwitcher>` | Standalone view toggle (embedded in CalendarView toolbar by default)                                                 |
| `<CalendarTimeGrid>`     | Week or day time-slot grid (used internally; standalone if needed)                                                   |
| `<CalendarSourceLegend>` | Sidebar calendar list with visibility toggles + color dots                                                           |
| `<SchedulerView>`        | Standalone week grid only — prefer `CalendarView view="week"`                                                        |
| `<AgendaList>`           | Standalone schedule list — prefer `CalendarView view="agenda"`                                                       |
| `<ResourceCalendar>`     | Staff / room columns by time                                                                                         |
| `<DateRangePicker>`      | Event start + end date pair in forms                                                                                 |

Shared types: `CalendarEvent`, `CalendarSource`, `CalendarColorKey`. Events use `calendarId` + source colors (Google-style solid fills). Week starts Monday. See [`calendar-components.md`](./calendar-components.md).

### App shell patterns (apps/web)

| Need                     | Component                                                                         | Notes                                                                         |
| ------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ⌘K / header search       | `CommandPaletteProvider` + `useCommandPalette`                                    | `@/components/command/CommandPalette`                                         |
| Org switcher             | `<OrganizationMenuSection>`                                                       | Inside profile dropdown (`HeaderAccountMenu`) — not a separate header control |
| Notifications            | `<NotificationPanel>`                                                             | Header popover with `ListRow` items                                           |
| Bulk CSV import          | `<BulkImportWizard>` / `<BulkImportTrigger>`                                      | List page header — e.g. `/clients`, `/products`                               |
| Active location          | `<ActiveLocationPicker>` `<ActiveLocationInfoButton>` `<LocationSitesDetailList>` | Header + settings; requires `ActiveLocationProvider`                          |
| Calendar sync accounts   | `<ConnectedAccountsHeaderMenu>`                                                   | Header — connected email/calendar account switcher                            |
| Settings language        | `<LanguageSelector>`                                                              | Settings general section (also in account menu via `LanguageMenuSection`)     |
| Route error boundary     | `<RouteErrorPage>` / `<AppErrorPage>`                                             | Router `errorElement` + chunk-load auto-reload                                |
| Link storage files       | `<StorageFileLinkPickerDialog>`                                                   | Used by `EntityStoragePanel` link action                                      |
| Business contact picker  | `<BusinessContactPicker>`                                                         | `@/components/pickers/BusinessContactPicker`                                  |
| Funeral case picker      | `<FuneralCasePicker>`                                                             | Vertical-specific; respects active location                                   |
| Form leave guard         | `useFormLeaveBlocker`                                                             | In-app navigation when form dirty (with `useFormDirtyGuard`)                  |
| Folder tree              | `<TreeList nodes>`                                                                | `CollapsibleSection` branches                                                 |
| Document list + preview  | `<DocumentPreviewPanel>`                                                          | `/documents` module · entity document tabs                                    |
| Generate / send document | `<DocumentGenerateDialog>` `<DocumentSendDialog>`                                 | `/documents` module · template pickers + `DialogFormFooter`                   |
| Template pickers         | `<TemplatePicker>` `<EmailTemplatePicker>`                                        | `/documents` → Templates tab                                                  |
| Approvals                | `<ApprovalPanel>` `<ApprovalHistory>` `<ApproveRejectDialog>`                     | PO/invoice/leave sign-off flows                                               |
| Task queue               | `<TaskInbox>`                                                                     | `/tasks` module                                                               |
| Comments                 | `<CommentsPanel>`                                                                 | Record thread + internal notes                                                |
| Catalog settings         | `<CatalogOptionsManager>`                                                         | Payment terms, case types, etc.                                               |
| Saved list views         | `<SavedViewSelector>` + `useListSavedViews()`                                     | `CrudMainView` `toolbarTrailing` — `/clients`, `/products`                    |
| RBAC blocked module      | `<AccessDeniedPage>`                                                              | `@/components/common/AccessDeniedPage` — `/access-denied`                     |

### Agent / AI chat (apps/web)

See [`agent-components.md`](./agent-components.md).

| Need                        | Component                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Import                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Full message thread         | `<AgentMessageList>`                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `@/components/agent/AgentMessageList`                         |
| Chat shell (page + sidebar) | `<OsirisChatShell>`                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `@/components/layout/OsirisChatShell`                         |
| Empty thread                | `<AgentWelcomeScreen>`                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `@/components/agent/AgentWelcomeScreen`                       |
| Loading state               | `<AgentThinkingIndicator>`                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `@/components/agent/AgentThinkingIndicator`                   |
| Composer attachments        | `<AgentFileAttachmentChip>`                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `@/components/agent/AgentFileAttachmentChip`                  |
| Header settings             | `<AgentSettingsPopover>`                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `@/components/agent/AgentSettingsPopover`                     |
| Context usage               | `<ContextUsageIndicator>` `<TokenBadge>`                                                                                                                                                                                                                                                                                                                                                                                                                                    | `@/components/agent/ContextUsageIndicator`                    |
| Tool call row               | `<AgentToolCallCard>`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `@/components/agent/AgentToolCallCard`                        |
| Action confirm              | `<AgentConfirmationCard>`                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `@/components/agent/AgentConfirmationCard`                    |
| Result cards                | `AgentEntityListCard`, `AgentEntityDetailCard`, `AgentPythonExecutionCard`, `AgentGeneratedDocumentCard`, `AgentScheduleCard`, `AgentSkillApprovalCard`, `AgentFinancialCard`, `AgentSearchResultsCard`, `AgentTimelineCard`, `AgentActionItemsCard`, `AgentActiveTimerCard`, `AgentPlannerCard`, `AgentMemoryCard`, `AgentProjectSummaryCard`, `AgentCatalogItemCard`, `AgentDocProcessingCard`, `AgentEmailComposeCard`, `AgentContextDumpCard`, `AgentSalesDocumentCard` | `@/components/agent/cards`                                    |
| Render card payload         | `renderAgentCard(card, options)`                                                                                                                                                                                                                                                                                                                                                                                                                                            | `@/components/agent/cards`                                    |
| Backend UI component name   | `<ChatUIComponent name props />`                                                                                                                                                                                                                                                                                                                                                                                                                                            | `@/components/agent/UIComponentRegistry`                      |
| Structured assistant text   | `<StructuredContent text={…} />`                                                                                                                                                                                                                                                                                                                                                                                                                                            | `@/components/agent/structured/StructuredContent`             |
| Attachment preview          | `<ChatFilePreviewDialog>`                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `@/components/agent/ChatFilePreviewDialog`                    |
| Editable thread title       | `<EditableConversationTitle>`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `@/components/agent/EditableConversationTitle`                |
| Voice input                 | `<VoiceRecorder>` `<RecordingBar>`                                                                                                                                                                                                                                                                                                                                                                                                                                          | `@/components/agent/VoiceRecorder`                            |
| Side panel                  | `<ContentPanel>`                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `@/components/agent/ContentPanel`                             |
| Mobile agent layout         | `<MobileAgentLayout>`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `@/components/layout/MobileAgentLayout`                       |
| App loading state           | `<AppShellSpinner>`                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `@/components/layout/AppShellSpinner`                         |
| Location picker             | `<ActiveLocationPicker>` `<ActiveLocationInfoButton>`                                                                                                                                                                                                                                                                                                                                                                                                                       | `@/components/layout/` · wrap app in `ActiveLocationProvider` |
| Shortcut help               | `<ShortcutHelpDialog>`                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `@/components/layout/ShortcutHelpDialog`                      |
| Recipient combobox          | `<RecipientCombobox>`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `@/components/forms/RecipientCombobox`                        |
| Page file drop zone         | `<PageFileDrop>`                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `@/components/forms/PageFileDrop`                             |
| Role selector               | `<RoleSelector>`                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `@/components/admin/RoleSelector`                             |
| User status badge           | `<StatusBadge>` + `USER_STATUS_VARIANT` from `modules/users/shared.tsx`                                                                                                                                                                                                                                                                                                                                                                                                     | `@/components/feedback/StatusBadge`                           |
| Org custom roles            | `<OrgCustomRolesSection>`                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `@/components/admin/OrgCustomRolesSection`                    |
| Message types               | `AgentMessage`, `AgentCardPayload`, …                                                                                                                                                                                                                                                                                                                                                                                                                                       | `@/components/agent/types`                                    |
| Links + mentions in text    | `<FormattedText>` (used inside `StructuredContent`)                                                                                                                                                                                                                                                                                                                                                                                                                         | `@/components/common/FormattedText`                           |

### Maps (apps/web)

See [`maps-components.md`](./maps-components.md).

| Need                       | Component                     | Import                               |
| -------------------------- | ----------------------------- | ------------------------------------ |
| **Inline map (preferred)** | `<GoogleMapsPreview>`         | `@/components/maps/GoogleMapsDialog` |
| Dialog trigger             | `<GoogleMapsPreviewButton>`   | `@/components/maps/GoogleMapsDialog` |
| Full dialog                | `<GoogleMapsDialog>`          | `@/components/maps/GoogleMapsDialog` |
| Extract URLs from text     | `extractGoogleMapsUrls(text)` | `@/components/maps/googleMapsEmbed`  |
| Embed URL resolver         | `resolveGoogleMapsEmbed(url)` | `@/components/maps/googleMapsEmbed`  |

Optional env: `VITE_GOOGLE_MAPS_EMBED_API_KEY` for official Embed API directions.

### Documents (apps/web)

Shared helpers: `documentPreviewUtils.ts` (download, list-row → preview), `documentPreviewDemoData.ts` (demo queue only).

| Need                    | Component                          | Import                                        |
| ----------------------- | ---------------------------------- | --------------------------------------------- |
| Standalone file preview | `<DocumentPreview>`                | `@/components/documents/DocumentPreview`      |
| Toolbar + preview       | `<PdfPreviewPanel>`                | `@/components/documents/PdfPreviewPanel`      |
| List + preview split    | `<DocumentPreviewPanel files={…}>` | `@/components/documents/DocumentPreviewPanel` |

### Pickers (apps/web)

| Need                    | Component         | Import                               |
| ----------------------- | ----------------- | ------------------------------------ |
| Generic entity relation | `<EntityPicker>`  | `@/components/pickers/EntityPicker`  |
| Contact lookup          | `<ContactPicker>` | `@/components/pickers/ContactPicker` |
| Project lookup          | `<ProjectPicker>` | `@/components/pickers/ProjectPicker` |

### Collaboration (apps/web)

| Need                          | Component           | Import                                  |
| ----------------------------- | ------------------- | --------------------------------------- |
| Record comments thread        | `<CommentsPanel>`   | `@/components/workflow/CommentsPanel`   |
| `@` mention composer          | `<MentionComposer>` | `@/components/workflow/MentionComposer` |
| Rich text with mentions/links | `<FormattedText>`   | `@/components/common/FormattedText`     |

### Reports (apps/web)

| Need                 | Component              | Import                                    |
| -------------------- | ---------------------- | ----------------------------------------- |
| Report builder panel | `<ReportBuilderPanel>` | `@/components/reports/ReportBuilderPanel` |

### Toast

```ts
import { appToast } from '@/lib/toast';

appToast.success('Record saved.');
appToast.error('Failed to save.');
appToast.warning('Expires in 7 days.');
appToast.info('3 items selected.');
appToast.fromApiError(error);
appToast.promise(asyncFn(), { loading: 'Saving…', success: 'Saved!', error: 'Failed.' });
```

Toaster is mounted in `AppLayout` — never add it yourself.

### Form field additions

| `type`     | Value type     | Notes                                                                                                   |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `relation` | string         | Same as `combobox` but semantically an entity picker. Supports `asyncItems`, `onCreate`, `footerAction` |
| `file`     | `File \| null` | Drag-and-drop file picker. Handle upload in `onSubmit`, not inside the form                             |

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

| Variant       | Visual               | When                                                                                                                                                                       |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cta`         | Brand violet         | **Primary action in the current context.** Page header "New X", and Save/Create in dialogs (`EntityForm surface="dialog"`). Purple signals the recommended confirm action. |
| `default`     | White + light border | Full-page form Save/Create on dedicated routes, wizard steps, toolbar actions.                                                                                             |
| `outline`     | Bordered, white bg   | Toolbar actions, export, filters, secondary action next to a primary                                                                                                       |
| `ghost`       | No bg                | Cancel / Back / dismiss in dialog footers, icon buttons, inline controls, low-emphasis actions                                                                             |
| `destructive` | Red                  | Delete, irreversible actions                                                                                                                                               |

**CTA usage:** Use `variant="cta"` for (1) the page-header entry action ("New client"), and (2) the primary confirm in a dialog (Save, Create) — Cancel stays `ghost`. Full-page create/edit routes keep `variant="default"` on submit. Use `<EntityForm surface="dialog">` in modals; it defaults submit to `cta` and skips the nested card.

Hierarchy (strongest → weakest): `cta` → `default` → `outline` → `ghost`.

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

| Context                              | Format                             | Example                        |
| ------------------------------------ | ---------------------------------- | ------------------------------ |
| `DatePicker` display                 | `DD.MM.YYYY`                       | `15.03.2024`                   |
| `DatePicker` datetime display        | `DD.MM.YYYY HH:mm`                 | `15.03.2024 14:30`             |
| Table/list columns (`type: 'date'`)  | `DD.MM.YYYY`                       | `15.03.2024`                   |
| `RelativeTime` tooltip               | `DD.MM.YYYY`                       | hover shows `15.03.2024`       |
| Internal ISO value (form state, API) | `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` | stays ISO, never shown to user |

`DatePicker` accepts typed input in DD.MM.YYYY, DD/MM/YYYY, and YYYY-MM-DD — always normalizes display to DD.MM.YYYY on blur.

### Input style — filled, no borders

All input controls use a filled gray style. No visible border in normal state.

| State                           | Classes                                           |
| ------------------------------- | ------------------------------------------------- |
| Normal                          | `bg-muted/60 rounded-control`                     |
| Hover                           | `hover:bg-muted/80`                               |
| Focus                           | `focus-visible:ring-2 focus-visible:ring-ring/40` |
| Focus-within (container inputs) | `focus-within:ring-2 focus-within:ring-ring/40`   |
| Error                           | `ring-2 ring-destructive`                         |

Never use `border border-input bg-background` on input surfaces. That style is retired.

### Input height standard

All single-line input controls must be **`h-9`** (36px): `Input`, `Select`, `Combobox`, `NumberInput`, `DatePicker`. Exception: `InlineEdit` uses `h-7` (compact inline context only).

### Button sizes

| size      | height    | use                                                     |
| --------- | --------- | ------------------------------------------------------- |
| `sm`      | `h-7`     | SectionCard actions, row-level controls, tight toolbars |
| `default` | `h-9`     | Standard form actions — matches input height            |
| `lg`      | `h-10`    | Full-page form primary submit (not page header)         |
| `icon`    | `h-9 w-9` | Icon-only buttons (back, Edit, Delete in header)        |

**Page header row:** only `sm` (h-7) for labeled buttons — use `PageHeaderButtons`. Export is icon-only (`h-7 w-7`). Do not use `default`/`lg` in the header.

Button text is `text-sm` at all sizes except `sm` which uses `text-xs`.

### Design tokens — radius and shadow

All radius and shadow values are centralized in `globals.css` as CSS variables. Change once, all components update.

```
--radius-card: 0.75rem     →  rounded-card    — all surface containers (cards, panels, table container)
--radius-control: 0.625rem →  rounded-control — inputs, buttons, filter pills
--radius-badge: 0.375rem   →  rounded-badge   — badges, chips
--shadow-card: none        →  shadow-card     — Card, StatCard, unified table container (flat)
--shadow-elevated: deeper  →  shadow-elevated — dropdowns, popovers, dialogs
```

Always use semantic classes. Never use `rounded-lg` on named surfaces — use `rounded-card`.

| Surface                | Classes                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `Card`                 | `rounded-card bg-card` (no border)                                               |
| `SectionCard`          | borderless: heading + `border-b border-border/50` rule + content                 |
| `StatCard`             | `rounded-card bg-card` (no border)                                               |
| CrudMainView container | `rounded-card bg-card` (no border)                                               |
| `SplitView`            | borderless outer; draggable separator with `border-border/50` line between panes |
| `SettingsRow`          | borderless; rows separated by `border-b border-border/50 last:border-b-0`        |
| `AttachmentList`       | `divide-y divide-border/50` (no per-row card)                                    |

**Borderless surface rule.** Cards are pure white tiles (`bg-card` → neutral ramp) on a `bg-muted/40` page wash — separation comes from contrast, not from borders. Never re-add a `border` class to `Card`, `StatCard`, `SectionCard`, `CrudMainView` table container, or `SplitView` outer.

**No drop shadows on card surfaces.** `shadow-card` is set to `none`. Only floating/overlay elements use shadows: dropdowns, dialogs, popovers, tooltips, the token editor panel (`shadow-elevated`).

### Section titles — no ALL-CAPS

`SectionCard` titles use `text-sm font-semibold text-foreground`. Never `uppercase tracking-widest` — it looks dated. Reserve ALL-CAPS only for `StatCard` labels (`text-xs font-medium text-muted-foreground` — compact KPI context).

### Whiteness hierarchy (closer = whiter)

Elevation through brightness — the closer something is to the user (interactive surfaces), the whiter it is.

| Layer                     | Token / color                         | Example                                                              |
| ------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| App page wash             | `bg-muted/40`                         | Main content — only background tint                                  |
| Shell chrome              | `APP_SHELL_SURFACE_CLASS` (`bg-card`) | Nav rail, header, agent chat — one surface                           |
| Cards / panels / surfaces | `bg-card` (aliases `neutral-0`)       | `Card`, `StatCard`, `CrudMainView`                                   |
| Inline sections (no card) | no bg, no border                      | `SectionCard`, `CollapsibleSection`, `SettingsRow`, `AttachmentList` |
| Interactive inputs        | `bg-muted/60` (filled gray)           | `Input`, `Select`, `Textarea`, `Combobox`, `NumberInput`             |
| Hover state on inputs     | `bg-muted/80`                         | Hovered input controls                                               |
| Hover / muted fills       | `bg-muted` (93%)                      | Button hover, item hover states                                      |

**Rules:**

- Cards are pure white. Never re-tint `bg-card`.
- Page wash (`bg-muted/40`) is the only background tint. Containers go on top of it as white tiles.
- Inputs stay filled-grey so form fields read as carved without borders. Never use `border border-input bg-background` on inputs.

### No cards-in-cards

Page surfaces are borderless white tiles. Internal grouping inside them uses:

- Section headings (`SectionCard` — heading + bottom rule)
- Dividers (`border-t border-border/50`)
- Spacing (`space-y-4` / `space-y-6`)

Never nest `<Card>` inside `<Card>`. Use `<SectionCard>` for content sections inside module detail pages — it is borderless by design.

### Border opacity system

Borders are reserved for **rules and dividers**, not container chrome. Card surfaces are borderless.

| Token                            | Use                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `border-border`                  | Heavy rules (rare)                                                                                                                                 |
| `border-border/70`               | Section dividers inside EntityForm/DetailView                                                                                                      |
| `border-border/50`               | `SectionCard` heading underline; `SettingsRow` row separators; `SplitView` sidebar/content split; `AttachmentList` row dividers; `ListRow` borders |
| `border-dashed border-border/60` | `InlineEmptyState`, `ListRow` variant `dashed`                                                                                                     |

### Page header layout (`ModulePage` / `PageHeader`)

The header is a two-column grid: **title block (left)** · **actions (top-right on `md+`)**.

| Slot       | What belongs there                                                                               | What does **not** belong                        |
| ---------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `title`    | Record name / number                                                                             | Status chips                                    |
| `subtitle` | Meta line (client, SKU, owner) **and** `StatusBadge` / priority / stage tags                     | Primary CTAs                                    |
| `actions`  | `variant="cta"` “New X” on list pages; icon-only Edit/Delete on detail pages; other real buttons | `StatusBadge`, `Badge`, or read-only state tags |
| `backTo`   | `<BackButton>` — icon-only, `aria-label="Back"`                                                  | Visible “Back” text                             |

**Edit / Delete on detail pages:** Always icon-only — use `<IconEditButton>` / `<IconDeleteButton>` (`size="icon"`, `variant="outline"`, `aria-label`). Never render visible “Edit” or “Delete” labels in the page header. Dropdown menus and dialogs may still use text labels.

**List page primary CTA:** Pass `headerActions` on `<CrudMainView>` (maps to `actions`) — use `<PageHeaderCtaLink>` or `<PageHeaderCtaButton>` from `PageHeaderButtons`. Export is rendered by `CrudMainView` via `<PageHeaderOutlineButton>` when `exportOptions` is set.

**Header button sizing:** Every labeled button in the page header row uses **`size="sm"` (h-7)** via `PageHeaderButtons`. Never mix `default` or `lg` in `actions`. Export is **icon-only** (`PageHeaderExportButton`) with tooltip.

**Header action order (always):** Export (icon) → secondary (`PageHeaderOutlineLink`, etc.) → primary CTA (`PageHeaderCtaLink`) last. `CrudMainView` renders Export before `headerActions`; put secondary then CTA inside `headerActions`.

Import `PAGE_HEADER_ACTIONS_ROW` or wrap groups in `<PageHeaderActions>` from `@/components/common/PageHeaderButtons`.

### Detail page patterns

- **Simple entity** (users, contacts): `ModulePage` + `DetailView` — flat sections in one scroll. **Do not nest `DetailView` inside `Tabs`** (it wraps a `Card`; use `SectionCard` in tab content instead).
- **Long or multi-section record** (profile, compliance, settings-like details): `ModulePage` + `AppSectionNavLayout` — section navigation keeps sections discoverable.
- **Complex entity / workspace with peer modes** (cases, projects, clients with sub-entities): `ModulePage` + `Tabs` only when the tabs are true work modes — each tab contains one or more `SectionCard` components.
- Within tabs or section-nav panels, use `ListRow` for sub-entity lists (parties, tasks, attachments). Use `CrudTable` only for independently sortable/paginated datasets.

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
- Section heading (`SectionCard`, tab content): `text-sm font-semibold text-foreground` — sentence case, no ALL-CAPS
- DetailView field labels: `CARD_CONTENT_TIERS.label` — sentence case, never uppercase spreadsheet headers
- Card title: `CardTitle` component
- Body: `text-sm`
- Muted/meta: `text-xs text-muted-foreground`

### Colors — use semantic tokens only

Full architecture: [`design-tokens.md`](./design-tokens.md).

| Token                                         | Use                                                          |
| --------------------------------------------- | ------------------------------------------------------------ |
| `text-foreground`                             | Primary text                                                 |
| `text-muted-foreground`                       | Secondary / meta                                             |
| `bg-card`                                     | White tile surface — aliases neutral ramp                    |
| `bg-muted/60`                                 | Input fill (normal state)                                    |
| `bg-muted/80`                                 | Input fill (hover state)                                     |
| `bg-muted` / `bg-muted/40`                    | Hover fills; `/40` = page wash only                          |
| `border-border`                               | Default borders — aliases neutral ramp                       |
| `text-destructive`                            | Errors, delete                                               |
| `text-success` / `text-warning` / `text-info` | Status colors                                                |
| `bg-teal` / `bg-orange`                       | Calendar categories, chart series                            |
| `neutral-0` … `neutral-950`                   | Gray ramp — source of truth; viz/calendar only in components |
| `APP_SHELL_SURFACE_CLASS`                     | Shared nav / header / chat background                        |
| `bg-primary text-primary-foreground`          | Default button (near-black / near-white)                     |
| `bg-cta text-cta-foreground`                  | CTA button (brand violet)                                    |
| `bg-accent text-accent-foreground`            | Accent backgrounds (light violet tint)                       |

**Tone helper:** `getSemanticToneClasses(tone, variant)` from `@oktavius/base-ui` — used by Badge, AlertBanner, StatusDot, Timeline, InfoBox, calendar fills. Do not invent local tone maps.

---

## Module Pattern

Each ERP module in `apps/web/src/modules/<name>/`:

```
clients/
├── ClientsListPage.tsx    # CrudMainView — filter, sort, paginate, export
├── ClientCreatePage.tsx   # ModulePage + EntityForm
├── ClientDetailPage.tsx   # ModulePage + DetailView / section nav / SplitView / true workspace tabs + action buttons
└── shared.tsx             # columns (CrudColumn[]), formFields (FormField[]), header actions
```

**List page sort state:** single `sort` string — `"field"` for asc, `"-field"` for desc. Use `useListPageState()` from `@/lib/useListPageState` for search/filter/sort/pagination, then pass the returned props to `CrudMainView`.

**Module page icon:** every `CrudMainView` and `ModulePage` must pass `icon`. Export `*PageIcon()` from `shared.tsx` (re-export from `@/lib/modulePageIcons`). User detail uses `userRecordPageIcon()` (`UserCircleIcon`); all other user routes use `usersPageIcon()`.

**Detail page:** Simple records → `DetailView` with sections. Many sections → `AppSectionNavLayout`. Queue workflows → `SplitView`. Peer workspace modes → `Tabs` + `SectionCard` (never `DetailView` inside tabs). Never build custom field-row layouts.

**Form page:** All fields go through `EntityForm`. Group logically via `section`. Boolean fields (checkbox/switch) skip the outer `<Label>` — label is inline with the control.

---

## Dev Commands

```bash
cd oktavius-v3
pnpm install
pnpm dev          # http://localhost:5173
pnpm lint         # UI guardrails + TypeScript checks
pnpm typecheck
```

Key routes: `/dashboard` `/showcase` `/users` `/users/new` `/users/:id` `/clients` `/clients/new` `/clients/:clientId`

---

## Do / Don't

| ✅ Do                                                                                            | ❌ Don't                                                                                            |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Import icons from `@/lib/icons`                                                                  | Import from `@phosphor-icons/react` directly                                                        |
| Use `CrudTable` / `CrudMainView` for all data grids                                              | Build custom `<table>` layouts                                                                      |
| Keep `FilterToolbar` on one line — search + filters scale with `flex-nowrap`                     | Stack search and filter dropdowns vertically or use multi-row filter grids                          |
| Keep list tables inside the card (`max-w-full`, `columnStretch="all"`)                           | Tables wider than the workspace / horizontal page scroll                                            |
| Use `EntityForm` with field registry                                                             | Build one-off form layouts                                                                          |
| Use `DatePicker` with `mode` prop                                                                | Use `<input type="date">` natively                                                                  |
| Use `Combobox` for **every** single-select dropdown (forms, filters, settings)                   | `Select` / `<select>` / Radix select in app code                                                    |
| Use `MultiSelect` for multiple choice                                                            | Multiple checkboxes scattered in form                                                               |
| Use `TagsInput` for free-form arrays                                                             | Comma-separated text fields                                                                         |
| Add `exportOptions` to `CrudMainView`                                                            | Wire export separately per module                                                                   |
| Group form fields by `section`                                                                   | Flat long single-section forms                                                                      |
| Use semantic color tokens                                                                        | Hard-code `text-gray-500`, `bg-white`                                                               |
| Use `bg-muted/60` + `hover:bg-muted/80` on input surfaces                                        | `border border-input bg-background` on inputs (retired)                                             |
| Use `rounded-card` on all named surfaces (cards, list rows, panels)                              | `rounded-lg` on named surfaces                                                                      |
| Use `variant="cta"` for page-header "New X" and dialog Save/Create                               | Use `variant="cta"` on full-page form submit (use `default`)                                        |
| Use `variant="ghost"` for dialog Cancel / Back / dismiss actions                                 | Use `outline` for Cancel in dialog footers                                                          |
| Use `<EntityForm surface="dialog">` or `<DialogFormFooter>` inside Dialog — purple Save/Create   | Hand-roll dialog footers with `variant="default"` on confirm                                        |
| Pass `variant="destructive"` on `AlertDialogAction` / `ConfirmActionDialog` for deletes          | Use purple CTA on delete confirms                                                                   |
| Use `variant="outline" size="sm"` for toolbar/filter reset buttons                               | Use default-size outline button next to compact controls                                            |
| Use `StatusBadge` for all status rendering                                                       | Inline ad-hoc badge per module                                                                      |
| Use `ModulePage` for every route — always with `icon`                                            | Custom page shells or header rows without module icon                                               |
| Put status / priority / stage tags in `subtitle`, not in `actions`                               | Status badges in the top-right header slot                                                          |
| Use `<IconEditButton>` / `<IconDeleteButton>` in page header `actions`                           | Visible “Edit” / “Delete” text on header buttons                                                    |
| Use `PageHeaderButtons` for list header actions (all h-7); Export icon-first                     | Labeled Export or `size="default"`/`lg` in page header                                              |
| Use `variant="cta"` for list-page “New X” in `CrudMainView` `headerActions`                      | Status chips or icon Edit/Delete in list header actions                                             |
| Use `SectionCard` for detail page content sections                                               | Nest `<Card>` inside page `<Card>`                                                                  |
| Use `ListRow` for sub-entity item lists                                                          | Build custom bordered div rows per module                                                           |
| Use `InlineEmptyState` inside `SectionCard`                                                      | Custom "no items" paragraph styling                                                                 |
| Use `CollapsibleSection` for long/optional field groups                                          | Always-expanded long forms                                                                          |
| Use `Tabs` only for peer workspace modes                                                         | Use top tabs as the default shape for every generated detail page                                   |
| Use `border-border/60` for section card borders                                                  | `border-border` (too heavy) or `border-gray-*`                                                      |
| Use `StatCard` for all KPI / metric displays                                                     | Custom div per module                                                                               |
| Use `Timeline` for audit trail and activity                                                      | Custom list markup per module                                                                       |
| Use `appToast` from `@/lib/toast` for action feedback                                            | `alert()`, inline banners for transient messages                                                    |
| Use `StepperLayout` for multi-step creation flows                                                | Accordion or tab abuse for wizards                                                                  |
| Use `SplitView` + `SplitViewQueue` + `ListRow variant="queue"` for master-detail sidebars        | `divide-y` or tight `p-1` stacks in split sidebars                                                  |
| Put severity/status badges under detail title/meta in split panels                               | Badges in top-right of split detail header                                                          |
| Use `Tabs` for master-detail queue filters (Open/All)                                            | Loose filter `Button` groups above splits                                                           |
| Use `SettingsLayout` + `SettingsRow` for settings pages                                          | Custom settings layout per module                                                                   |
| Use `InlineEdit` for click-to-edit in detail views                                               | Full form modal for single-field edits                                                              |
| Use `relation` field type for entity pickers                                                     | Custom combobox wiring per form                                                                     |
| Use `file` field type for document attachment                                                    | Raw `<input type="file">` per module                                                                |
| Use `Dialog` for form modals + large confirms                                                    | `window.confirm()` or custom overlay                                                                |
| Use `Tooltip` on all icon-only buttons                                                           | `title` attribute                                                                                   |
| Use `Avatar` / `RecordVisual` with icon fallbacks for people and entities                        | Ad-hoc `rounded-full bg-muted` divs or letter initials per module                                   |
| Use `StatusDot` / `StatusDotLabel` for inline status                                             | Inline colored spans per module                                                                     |
| Use `CountBadge` beside section titles and tab triggers                                          | Raw `<Badge>{count}</Badge>` per module                                                             |
| Use `CopyButton` for clipboard actions                                                           | Custom copy logic per module                                                                        |
| Use `ConfirmPopover` for row-level destructive actions                                           | `ConfirmActionDialog` for inline deletes                                                            |
| Use `DateRangePicker` for start+end date fields                                                  | Two unconnected DatePicker instances                                                                |
| Use `ScrollArea` for bounded-height panels                                                       | `overflow-y-auto` without styled scrollbar                                                          |
| Use `NumberInput` for numeric fields needing thousands formatting                                | `<Input type="number">` for display-formatted amounts or integer counts                             |
| Filter keystrokes in specialized fields (phone, postal, email, url)                              | Accept any characters and validate only on submit                                                   |
| Use `MoneyText` for all currency display                                                         | Ad-hoc `Intl.NumberFormat` calls per component                                                      |
| Use `formatDisplayDate` / `formatDisplayDateTime` from `@oktavius/base-ui` for all visible dates | `toLocaleDateString()`, `MMM d yyyy`, or per-module date helpers                                    |
| Use `RelativeTime` for timestamps in feeds and detail views                                      | Raw ISO or US date strings in UI                                                                    |
| Use `AlertBanner` for page-top persistent notices                                                | `InfoBox` for site-wide banners                                                                     |
| Use `AttachmentList` for all file attachment displays                                            | Custom file list markup per module                                                                  |
| Use `PageSkeleton` / `DetailSkeleton` for page load states                                       | Bare `<Skeleton>` lines scattered at page level                                                     |
| Lead complex entity detail pages with an Overview tab (stats + timeline + party summary)         | Start directly on the first data tab                                                                |
| Use `Dialog` + `EntityForm` for sub-entity add/edit (parties, tasks)                             | Inline editing rows or custom modal markup per module                                               |
| Use `<ChecklistSection>` for tick-off checklists — done = strikethrough + muted label            | Checkbox-only done state or `StatusBadge` on checklist rows                                         |
| Use `AgentMessageList` + result cards for agent structured output                                | Custom chat bubbles or nested cards per module                                                      |
| Use `GoogleMapsPreview` inline on detail/route panels                                            | Dialog-only maps or raw Google URLs in iframes                                                      |
| Use `GoogleMapsPreviewButton` in chat/compact rows; `extractGoogleMapsUrls` for link detection   | Custom map modal markup per module                                                                  |
| Use `DocumentPreview` / `PdfPreviewPanel` for file preview                                       | Custom iframe/pdf viewers per module                                                                |
| Use `MentionComposer` + `FormattedText` for @mentions                                            | Plain textarea with manual highlight styling                                                        |
| Keep base-ui component APIs variant-based (`variant`, `size`, `tone`)                            | Add `*ClassName` / `triggerClassName` / `contentClassName` escape-hatch props to base-ui components |
| Use `<TooltipProvider>` once (already in `AppLayout`)                                            | Add `<TooltipProvider>` inside individual components                                                |
