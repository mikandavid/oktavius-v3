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
- `SavedViewSelector` + `useListSavedViews()` — wired through `StandardCrudListPage` on standard CRUD lists that provide saved-view presets
- Sort, column visibility, resize, stretch-to-fit, export (XLSX)
- Row actions, bulk select, bulk delete/edit bar
- `statusColumn`, typed columns (status, date, currency)
- `TreeList`, `BulkImportWizard`, `BulkImportTrigger`, `exportGrid`

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
- `AddressMapSection` — detail-page address/place context plus inline map preview
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

- `CalendarView` — Day / Week / Month / Schedule + toolbar + sidebar
- `CalendarSidebar`, `CalendarMiniPicker` — sidebar filters + jump-to-date (styling locked)
- `CalendarTimeGrid`, `CalendarViewSwitcher`, `CalendarSourceLegend`
- `SchedulerView`, `AgendaList`, `ResourceCalendar`
- `CalendarMonthPreview` (legacy — prefer `CalendarView`)

### Agent (apps/web)

See [`agent-components.md`](./agent-components.md).

- `OsirisChatShell` — page, sidebar, and module-scoped chat (`/ai-chat`, right rail, detail Assistant tabs)
- `ModuleScopedAssistantPanel` — embeds the active page/entity context in generated-style detail workspaces and manual case/order detail tabs
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

- `RecipientCombobox` — multi-recipient chip combobox
- `PageFileDrop` — page-level drag-and-drop upload zone

### Admin (apps/web)

- `RoleSelector`, `StatusBadge` + per-module `*_STATUS_VARIANT` in `shared.tsx` (cross-module: `TASK_STATUS_VARIANT` in `@/lib/statusVariants`), `OrgCustomRolesSection`

### Reports (apps/web)

- `ReportBuilderPanel` — dataset/chart builder demo on Reports module

---

## Partially present — not ERP-complete

### Shell

- Generated module registry/codegen enforcement — `validateGeneratedModuleContract()` checks generated module descriptors against `appNavModules`, list/form/detail limits, related-record config usage, and supported task parent modules; current standard CRUD modules now emit contracts from `GeneratedModuleTemplateDescriptor` descriptors covered by tests, descriptor list-page metadata covers titles/search/entity/export/empty-state copy, generated list column descriptors cover key/header/sort/type/responsive hints, generated list filter descriptors cover labels/options, generated saved-view descriptors cover preset labels/defaults/filter payloads, generated row/bulk action descriptors cover keys/labels/destructive confirmation scaffolds, generated form/detail field descriptors cover names/labels/types/sections/options/inline-edit hints, and generated frontend API scaffolds point list/detail/form pages at `api.<resource>.list/get/create/update/delete` for current standard CRUD modules; `emitGeneratedModuleFiles()` produces deterministic generated module contract files for each descriptor, `materializeGeneratedModuleFiles()` writes emitted files through a verified filesystem adapter, `pnpm --dir apps/web generate:module-contracts` materializes current generated contract files, and `pnpm --dir apps/web generate:modules` emits contract, list, detail, form, and route files whose generated list/form/detail pages render `StandardCrudListPage`, `EntityForm`, and `DetailView` runtime shells with descriptor-driven filters, saved views, and frontend-only action scaffolds; production backend service parity and richer generated-page behavior remain
- Org switcher beyond demo data
- Real backend endpoint adoption for global search beyond command palette

### CRUD

- Saved column views per user — `SavedViewsStore` supports local and API-backed persistence; `createConfiguredSavedViewsStore()` switches generated-style lists to `/generated-stores/saved-views/:listKey` when `VITE_OKTAVIUS_API_BASE_URL` is configured; production backend service availability remains
- Real backend list/form transport — `StandardCrudListPage.loadRows` is wired across generated-style CRUD list modules, `createHttpRegistry()` maps generated registry handlers to HTTP endpoints, and `VITE_OKTAVIUS_API_BASE_URL` switches the app from demo handlers to the default HTTP registry; production backend services remain
- Permission-gated columns and custom list actions — `CrudColumn`, `CrudRowAction`, and `BulkAction` support a shared `permission` contract filtered by `CrudListShell`; `StandardCrudListPage` now accepts generated row and bulk action arrays, while production workflow handlers remain separate
- Backend-style API permission enforcement — `withPermissionedDemoApiRegistry()` rejects unauthorized generated deletes, user administration, and superadmin organization calls; production backend parity remains

### Forms

- Validation engine wiring to API errors — `EntityForm` accepts external errors and normalized `FormSubmissionResult` / `FormSubmissionValidationError`; `submitApiForm` is adopted across generated create/edit routes and detail edit dialogs
- Conditional field visibility rules — **partial:** `FormField.visibleWhen` wired in EntityForm
- Permission-gated generated fields — `FormField.permission` hides fields before rendering and validation schema generation
- Dirty guard / autosave — `useFormDirtyGuard`, `useFormLeaveBlocker`, `EntityForm.warnOnDirty`, and opt-in `EntityForm.autoSave` cover browser leave warnings, in-app route blocking, and debounced validated autosave

### Detail / workspace

- Permission-gated detail fields and shared delete actions — `DetailView` filters permissioned fields; shared detail header delete actions are gated by `canDeleteRecords`
- Custom detail action permissions — `DetailActions` renders permissioned generated/custom detail actions and `DetailPageHeaderActions` accepts permissioned `customActions`
- Quick edit on all detail fields — **partial:** `DetailView.inlineEdit` renders fields through shared `InlineEdit`; client, case, product, user, organization, contract, invoice, incident, project, and order detail scalar fields are wired; select/date/datetime/decimal/relation typed inline controls exist and are wired on enum, date, datetime, money, client/order, and assignment/contact relation fields across the generated-style detail modules; generated detail runtime shells render descriptor-driven `DetailView` fields, while generated inline-edit behavior remains richer in manual/generated-style modules
- Generated related-records panels — **partial:** `GeneratedRelatedRecordsPanel` config adapter exists; client contacts/orders/contracts/tasks, order line items/tasks, project tasks, and case parties use generated relation configs; broader detail-page relation rollout remains
- Generated inline map sections on every eligible location/address detail field — `AddressMapSection` is wired on client and funeral case details; broader codegen rollout remains

### Agent (apps/web)

- Live API/streaming integration — `createConfiguredAgentTransport()` switches chat turns to `VITE_OKTAVIUS_AGENT_API_URL`, supports bearer auth, and accumulates streamed assistant deltas; production backend service availability remains

### Settings / catalogs

- Generated settings module template — `GeneratedSettingsModule` composes section-nav settings pages from descriptors; `CatalogOptionsStore` provides local and API-backed persistence adapters, and `createConfiguredCatalogOptionsStore()` switches settings catalogs to `/generated-stores/catalog-options/:catalogKey` when `VITE_OKTAVIUS_API_BASE_URL` is configured

---

## Missing entirely (next extraction targets)

### Module system

- Production backend service availability for fully data-backed generated route/page files
- Production backend service availability for generated list/form/settings/report endpoints

### Reporting (advanced)

- Saved report persistence contract — `ReportStore` supports local and API-backed persistence; `createConfiguredReportStore()` switches report builders to `/generated-stores/reports/:storageKey` when `VITE_OKTAVIUS_API_BASE_URL` is configured; `ReportBuilderPanel` renders dataset-specific drill-down rows for selected saved reports; production backend service availability remains

---

## Priority order

For auto-generated ERP modules, build next in this order:

1. Production backend permission parity and service availability for list/form contracts
2. Production backend service availability for saved-view, catalog, and report stores
3. Generated-page parity pass for inline edit, related records, and production workflow-backed module actions
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
