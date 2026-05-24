# Missing Frontend Components

## Purpose

Tracks what is still missing before the extracted frontend base can reliably **generate** full ERP modules from contracts.

**Index:** [`README.md`](./README.md)

**Component registry:** [`component-registry.md`](./component-registry.md)

---

## Already present in oktavius-v3

### Shell and navigation

- `AppLayout`, `Sidebar`, `Header`, `MobileTopBar`, `AIChatSidebar`
- `CommandPalette` (⌘K)
- `NotificationPanel`, `HeaderAccountMenu`
- `pageChrome` layout classes

### Page chrome

- `ModulePage`, `PageHeader`, `BackButton`
- `PageHeaderButtons` (CTA, Export, outline links)
- `IconEditButton`, `IconDeleteButton`
- `InfoBox`, `EmptyState`, `ConfirmActionDialog`
- `DetailView`, `SectionCard`, `ChecklistSection`
- `SubEntityFormDialog`, `DialogFormFooter`
- `PageSkeleton`, `DetailSkeleton`

### Data / CRUD

- `CrudMainView`, `CrudTable` (Lytenyte)
- `FilterToolbar`, `Pagination`, `useListPageState`
- `SavedViewSelector` — saved filter/column views dropdown for list pages
- Sort, column visibility, resize, stretch-to-fit, export (XLSX)
- Row actions, bulk select, bulk delete/edit bar
- `statusColumn`, typed columns (status, date, currency)
- `TreeList`, `BulkImportWizard`, `exportGrid`

### Forms

- `EntityForm` — text, email, url, phone, number, textarea, combobox/select, multiselect, tags, checkbox, switch, radio, date, time, datetime, currency, relation, file, address
- `FormField` — label, hint, error, and accessibility wrapper for custom controls
- `PhoneInput`, `RadioGroupField`, `AddressField` — wired as EntityForm field types
- Async combobox, inline create, footer actions
- `EntityForm.errors` prop for API validation messages

### Display / layout (base-ui)

- `StatCard`, `ChartCard`, `Timeline`, `ListRow`, `InlineEmptyState`
- `KanbanBoard` — reusable pipeline columns (cases board uses this)
- `SettingsTable` — compact admin/catalog table
- `Tabs`, `SplitView`, `SplitViewQueue`
- `SettingsLayout`, `SettingsSection`, `SettingsRow`
- `StepperLayout`, `Breadcrumb`, `InlineEdit`
- `StatusBadge`, `StatusDot`, `StatusDotLabel`, `CountBadge`
- `MoneyText`, `formatDisplayDate`, `RelativeTime`, `DateRangePicker`
- `AttachmentList`, `AlertBanner`, `RichTextEditor`
- Charts: `SimpleLineChart`, `SimpleBarChart`

### Workflow (apps/web)

- `ApprovalPanel`, `ApprovalHistory`, `ApproveRejectDialog`
- `TaskInbox`, `CommentsPanel`

### Documents (apps/web)

- `DocumentPreviewPanel`
- `TemplatePicker`, `EmailTemplatePicker`
- `DocumentGenerateDialog`, `DocumentSendDialog`

### Settings / catalogs (apps/web)

- `CatalogOptionsManager` — catalog CRUD with `SettingsTable` + dialog editor

### Calendar / planning (base-ui)

- `CalendarView` — Day / Week / Month / Schedule + toolbar + legend
- `CalendarTimeGrid`, `CalendarViewSwitcher`, `CalendarSourceLegend`
- `SchedulerView`, `AgendaList`, `ResourceCalendar`
- `CalendarMonthPreview` (legacy — prefer `CalendarView`)

### Agent

- Agent chat sidebar and `/ai-chat` route

---

## Partially present — not ERP-complete

### Shell

- Permission-aware navigation and module registry
- Org switcher beyond demo data
- Saved views persistence / global search beyond command palette

### CRUD

- Saved column views per user (UI exists — needs backend contract)
- Server-driven pagination contract (demo uses client state)
- Permission-gated columns and row actions

### Forms

- Validation engine wiring to API errors — **partial:** `EntityForm.errors` + `FormField` error display; still needs submit-time client rules
- Conditional field visibility rules
- Dirty guard / autosave
- JSON admin field

### Detail / workspace

- Permission-gated fields
- Quick edit on all detail fields (InlineEdit exists but not wired everywhere)
- Generated related-records panels

### Settings / catalogs

- Generated settings module template (blocks exist — needs codegen)

---

## Missing entirely (next extraction targets)

### Collaboration / agent

- Mentions UI in comments
- Agent tool approval cards, page context provider

### Module system

- Frontend module manifest and registry
- Generated module templates with design-rule validation
- Permission-aware shared action/field contracts

### Reporting (advanced)

- Saved report builder, drill-down report views (basic `ChartCard` + dashboard charts exist)

---

## Priority order

For auto-generated ERP modules, build next in this order:

1. Module manifest + generation contract enforcement
2. Server-backed list/form contracts (pagination, validation, permissions)
3. Generated settings module template (compose existing catalog blocks)
4. Mentions + agent approval cards
5. Advanced reporting builder

Calendar/planning UI is **done** in `@oktavius/base-ui`. Workflow, document, catalog, kanban, and chart blocks are **done** — wire into ERP modules as needed. See `/showcase` → Patterns → ERP blocks.

---

## Outdated names — do not use

| Old (FE planning)    | Current (oktavius-v3)        |
| -------------------- | ---------------------------- |
| `DataTable`          | `CrudTable` / `CrudMainView` |
| `MetricCard`         | `StatCard`                   |
| `CalendarBlock`      | `CalendarView`               |
| `Select` in app code | `Combobox`                   |
