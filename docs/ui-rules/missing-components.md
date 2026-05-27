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
- `ActiveLocationPicker`, `ActiveLocationInfoButton`, `LocationSitesDetailList`
- `ConnectedAccountsHeaderMenu`, `LanguageSelector`
- `AppErrorPage` / `RouteErrorPage` with chunk-load recovery
- `pageChrome` layout classes
- `AccessDeniedPage` — `@/components/common/AccessDeniedPage`

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
- `SavedViewSelector` + `useListSavedViews()` — wired on `/clients` and `/products` list pages
- Sort, column visibility, resize, stretch-to-fit, export (XLSX)
- Row actions, bulk select, bulk delete/edit bar
- `statusColumn`, typed columns (status, date, currency)
- `TreeList`, `BulkImportWizard`, `BulkImportTrigger`, `BulkImportDialog`, `exportGrid`

### Forms

- `EntityForm` — text, email, url, phone, number, textarea, combobox/select, multiselect, tags, checkbox, switch, radio, date, time, datetime, currency, relation, file, address, **json**
- `JsonField` — standalone JSON admin editor with format + parse validation
- `FormField` — label, hint, error, and accessibility wrapper for custom controls
- `FormField.visibleWhen` + `FormField.validate` — conditional visibility and client submit validation
- `useFormDirtyGuard` — browser tab-close warning when form values change
- `useFormLeaveBlocker` — in-app route navigation guard when form is dirty
- `PhoneInput`, `RadioGroupField`, `AddressField` — wired as EntityForm field types
- Async combobox, inline create, footer actions
- `EntityForm.errors` prop for API validation messages
- `EntityPicker`, `ContactPicker`, `ProjectPicker`, `BusinessContactPicker`, `FuneralCasePicker` — relation pickers for forms and filters

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
- Charts: `SimpleLineChart`, `SimpleBarChart`, `ChartCard` types (area, pie, stacked bar, gauge, funnel)

### Workflow (apps/web)

- `ApprovalPanel`, `ApprovalHistory`, `ApproveRejectDialog`
- `TaskInbox`, `CommentsPanel`
- `MentionComposer`, `FormattedText` — `@` mentions in comments and agent text

### Documents (apps/web)

- `DocumentPreview` — PDF, image, text, CSV, Excel inline preview
- `PdfPreviewPanel`, `DocumentPreviewPanel`
- `TemplatePicker`, `EmailTemplatePicker`
- `DocumentGenerateDialog`, `DocumentSendDialog`

### Maps (apps/web)

- `GoogleMapsPreview` — **inline** route/place embed (preferred for detail pages)
- `GoogleMapsDialog`, `GoogleMapsPreviewButton` — dialog for compact contexts
- `resolveGoogleMapsEmbed`, `extractGoogleMapsUrls` — URL helpers

### Settings / catalogs (apps/web)

- `CatalogOptionsManager` — catalog CRUD with `SettingsTable` + dialog editor

### Custom fields (apps/web)

- `CustomFieldsFormSection` — schema-driven org fields inside create/edit forms
- `CustomFieldsDetailSection` — read-only custom field groups on detail pages
- `useCustomFieldDefinitions()` — demo schema registry (`lib/custom-fields`)

### Detail / related (apps/web)

- `RelatedRecordsPanel` — linked entity list with view-all + add actions
- `AuditTrailPanel` — collapsible change history with field diffs
- `EntityStoragePanel` — grouped attachments with upload/link/delete (demo)
- `StorageFileLinkPickerDialog` — browse global storage library to link files

### Calendar / planning (base-ui)

- `CalendarView` — Day / Week / Month / Schedule + toolbar + legend
- `CalendarTimeGrid`, `CalendarViewSwitcher`, `CalendarSourceLegend`
- `SchedulerView`, `AgendaList`, `ResourceCalendar`
- `CalendarMonthPreview` (legacy — prefer `CalendarView`)

### Agent (apps/web)

See [`agent-components.md`](./agent-components.md).

- `OsirisChatShell` — page + sidebar chat (`/ai-chat`, right rail)
- `AgentMessageList` — user, assistant (`StructuredContent`), tool, confirmation, card messages
- `StructuredContent` + `<oct-*>` registry (`oct-stat`, `oct-data-card`, `oct-email`, chart tags)
- `AgentPageContextProvider`, `useAgentPageContext`, `useRegisterAgentPageContext`, `captureAgentPageContext`
- `AgentMessage.ui` + `ChatUIComponent` in message list
- `AgentToolCallCard`, `AgentConfirmationCard`
- Result cards: entity list/detail, python, document, schedule, skill approval, financial, search, timeline, action items, timer, planner, memory, project summary, catalog, doc processing, email compose, context dump, sales document
- `AgentWelcomeScreen`, `AgentThinkingIndicator`, `AgentFileAttachmentChip`
- `ChatFilePreviewDialog`, `EditableConversationTitle`, `VoiceRecorder`, `RecordingBar`, `ContentPanel`
- `AgentSettingsPopover`, `ContextUsageIndicator`, `TokenBadge`
- `AgentMessageShell`, `renderAgentCard`
- Shell extras: `AppShellSpinner`, `ActiveLocationPicker`, `ShortcutHelpDialog`, `MobileAgentLayout`

### Forms (apps/web extras)

- `DateTimePairField` — paired date + time inputs
- `RecipientCombobox` — multi-recipient chip combobox
- `PageFileDrop` — page-level drag-and-drop upload zone

### Admin (apps/web)

- `RoleSelector`, `UserStatusBadge`, `OrgCustomRolesSection`

### Reports (apps/web)

- `ReportBuilderPanel` — dataset/chart builder demo on Reports module

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

- Validation engine wiring to API errors — **partial:** `EntityForm.errors` + client `validate` rules on submit; still needs server parity
- Conditional field visibility rules — **partial:** `FormField.visibleWhen` wired in EntityForm
- Dirty guard / autosave — **partial:** `useFormDirtyGuard`, `useFormLeaveBlocker`, and `EntityForm.warnOnDirty` (no autosave)

### Detail / workspace

- Permission-gated fields
- Quick edit on all detail fields (InlineEdit exists but not wired everywhere)
- Generated related-records panels — **partial:** `RelatedRecordsPanel` exists; needs codegen wiring
- Inline `GoogleMapsPreview` on location/address detail fields (component exists — not wired on all modules)

### Agent (apps/web)

- Live API/streaming integration (UI blocks exist with demo data)
- Module-scoped assistant panels (global chat shell only)

### Settings / catalogs

- Generated settings module template (blocks exist — needs codegen)

---

## Missing entirely (next extraction targets)

### Module system

- Frontend module manifest and registry
- Generated module templates with design-rule validation
- Permission-aware shared action/field contracts

### Reporting (advanced)

- Saved report persistence, drill-down report views (`ReportBuilderPanel` is UI-only demo)

---

## Priority order

For auto-generated ERP modules, build next in this order:

1. Module manifest + generation contract enforcement
2. Server-backed list/form contracts (pagination, validation, permissions)
3. Generated settings module template (compose existing catalog blocks)
4. Agent API integration + page context provider
5. Advanced reporting persistence

Calendar/planning UI is **done** in `@oktavius/base-ui`. Workflow, document, catalog, kanban, chart, agent, map, and picker blocks are **wired** into demo modules — see `/showcase` and live routes `/documents`, `/tasks`, `/calendar`, `/clients/onboarding`, `/ai-chat`.

---

## Outdated names — do not use

| Old (FE planning)    | Current (oktavius-v3)        |
| -------------------- | ---------------------------- |
| `DataTable`          | `CrudTable` / `CrudMainView` |
| `MetricCard`         | `StatCard`                   |
| `CalendarBlock`      | `CalendarView`               |
| `Select` in app code | `Combobox`                   |
