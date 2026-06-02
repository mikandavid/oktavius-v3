# FE Component Blocks

## Purpose

This document lists the reusable frontend blocks that custom modules should compose.

## Block Rule

Use the simplest correct block.

- Tabular records: `CrudMainView` / `CrudTable` (not legacy `DataTable`).
- Single record: `DetailView`; use section nav, split view, or preview-led layouts before reaching for `Tabs` + `SectionCard`.
- Create/edit: `EntityForm` — or `SubEntityFormDialog` when the form lives in a dialog.
- Events / scheduling: `CalendarView`.
- Files/documents: `DocumentPreview` / `DocumentPreviewPanel` / `AttachmentList`.
- Maps/routes: `GoogleMapsPreview` (inline) or `GoogleMapsPreviewButton` (dialog).
- Metrics: `StatCard`, `ChartCard` (not `MetricCard`).
- Settings / catalogs: `AppSectionNavLayout` + `SettingsSection` + `SettingsRow`; config tables use `SettingsTable` (not `CrudTable`). See [`section-nav.md`](./section-nav.md).
- Status display: `StatusBadge` (not ad-hoc colored `Badge`).
- Empty sub-lists: `InlineEmptyState` (not raw `<p>` placeholders).
- Icons: `@/lib/icons` only in `apps/web`.
- Destructive actions: `ConfirmActionDialog` / `ConfirmPopover` (not instant delete).

Do not invent custom layouts when a base block fits.

## Composition stack (small → large)

| Layer                  | Examples                                                                                                      | Built from                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **base-ui primitives** | `Button`, `Input`, `Label`, `Checkbox`, `Switch`, `Table`, `Badge`, `Dialog`                                  | Radix + Tailwind tokens   |
| **base-ui blocks**     | `SectionCard`, `ListRow`, `SettingsTable`, `KanbanBoard`, `ChartCard`, `Combobox`                             | Primitives above          |
| **apps/web blocks**    | `EntityForm`, `SubEntityFormDialog`, `CrudMainView`, `StatusBadge`, `ConfirmActionDialog`, `DialogFormFooter` | base-ui + app rules       |
| **ERP module blocks**  | `CatalogOptionsManager`, `ApprovalPanel`, `DocumentSendDialog`, `TaskInbox`                                   | apps/web blocks + base-ui |

**Catalog example:** `CatalogOptionsManager` = `SectionCard` + `SettingsTable` (wraps `Table`) + `SubEntityFormDialog` (`Dialog` + `EntityForm`) + `IconEditButton` / `IconDeleteButton` + `ConfirmActionDialog` + `StatusBadge` + `PlusIcon`.

**When to use `SettingsTable` vs `CrudTable`:** catalogs and admin config (few columns, no pagination/export) → `SettingsTable`. Transactional module lists (sort, filter, bulk, export) → `CrudMainView`.

**Index:** [`README.md`](./README.md)

## DataTable Block

Purpose:

- Dense ERP list screens.

Inputs:

- rows
- columns
- filters
- sort
- pagination
- row actions
- bulk actions
- loading/error state

Used by:

- master data
- transaction records
- cases
- approvals
- documents
- tasks

## EntityForm Block

Purpose:

- Generated create/edit forms.

Inputs:

- schema
- field specs
- default values
- submit handler
- cancel handler
- permissions
- custom fields

Used by:

- create/edit pages
- dialogs
- settings forms
- event forms

## DetailView Block

Purpose:

- Read-only record display.

Inputs:

- sections
- fields
- values
- permissions
- actions

Used by:

- detail pages
- side panels
- agent result cards

## CaseWorkspace Block

Purpose:

- Reusable case/process module layout.

Includes:

- case header
- status/priority/assignee
- tabs
- detail sections
- related records
- activity feed
- comments
- tasks
- documents
- calendar/events

Used by:

- funeral cases
- property cases
- support cases
- damage cases
- HR cases

## CalendarBlock

Purpose:

- Show and edit events related to a module/entity.

Includes:

- calendar view
- agenda list
- event form
- category/tag styling
- staff/resource picker

Used by:

- Termine
- case events
- staff planning
- maintenance scheduling

## DocumentBlock

Purpose:

- Files, generated documents, previews, and sending.

Includes:

- attachment panel
- `DocumentPreview` / `PdfPreviewPanel`
- document list + split preview (`DocumentPreviewPanel`)
- generate dialog
- send dialog
- template picker
- email template picker

Used by:

- funeral cases
- invoices
- offers
- contracts
- HR docs

## TaskApprovalBlock

Purpose:

- Work queues and approvals.

Includes:

- `TaskInbox` — assigned work queue
- `ApprovalPanel` — pending approvals with approve/reject
- `ApproveRejectDialog` — shared confirmation + comment
- `ApprovalHistory` — timeline of approval steps
- priority/status badges

Used by:

- holiday requests
- purchase requests
- invoice approvals
- document send approvals
- AI action approvals

## ActivityCommentsBlock

Purpose:

- Show record history and collaboration.

Includes:

- `Timeline` — audit trail
- `CommentsPanel` — thread + internal notes
- `MentionComposer` + `FormattedText` — `@` mentions and links

Used by:

- cases
- customers
- approvals
- documents

## SettingsCatalogBlock

Purpose:

- Module settings and user-editable selector values.

Includes:

- `AppSectionNavLayout` + `SettingsSection` + `SettingsRow` (apps/web); base-ui provides `SettingsLayout` primitives
- `SettingsTable` — compact config rows
- `CatalogOptionsManager` — add/edit catalog entries
- editor dialog

Used by:

- payment terms
- holiday types
- case types
- document rules

## DashboardReportingBlock

Purpose:

- KPIs, charts, saved views, exports.

Includes:

- `StatCard`, `ChartCard` (area, pie, stacked bar, gauge, funnel)
- `ReportBuilderPanel` — report builder UI (demo)
- `SavedViewSelector` for list pages
- `SimpleLineChart`, `SimpleBarChart`
- export menu

Used by:

- module dashboards
- global dashboard
- reports

## KanbanBlock

Purpose:

- Pipeline / stage boards.

Includes:

- `KanbanBoard` — column grid with `ListRow` cards

Used by:

- CRM pipeline
- case board
- procurement stages

## MapsBlock

Purpose:

- Show routes and locations inline or in a dialog.

Includes:

- `GoogleMapsPreview` — inline embed (preferred on detail pages)
- `GoogleMapsPreviewButton` + `GoogleMapsDialog` — compact contexts
- `resolveGoogleMapsEmbed`, `extractGoogleMapsUrls`

Used by:

- field service / routing agent results
- location detail tabs
- logistics and site addresses

See [`maps-components.md`](./maps-components.md).

## AgentUIBlock

Purpose:

- Let users see and approve backend AI work.

Includes:

- `OsirisChatShell` / `AgentMessageList`
- `AgentWelcomeScreen`, `AgentThinkingIndicator`, `AgentFileAttachmentChip`
- `AgentSettingsPopover`, `ContextUsageIndicator`
- `AgentConfirmationCard`, `AgentToolCallCard`
- result cards: entity list/detail, python, document, schedule, skill approval
- `GoogleMapsPreviewButton` for map links in messages

Used by:

- global agent chat (`/ai-chat`, right rail)
- module assistant panels (future)
- action confirmations

See [`agent-components.md`](./agent-components.md).

## Example Composition: Case Management Module

```txt
CaseManagementModule =
  PageLayout
  + PageHeader
  + DataTable for case list
  + EntityForm for create/edit
  + CaseWorkspace for detail
  + CalendarBlock for appointments
  + DocumentBlock for files/generated docs
  + MapsBlock for site/route preview
  + TaskApprovalBlock for workflow
  + ActivityCommentsBlock for history/collaboration
  + AgentUIBlock for backend AI actions
```

## Example Composition: Holiday Module

```txt
HolidayModule =
  PageLayout
  + PageHeader
  + DataTable
  + EntityForm
  + DetailView
  + ApprovalPanel
  + ActivityFeed
```

## Example Composition: Document Settings Module

```txt
DocumentSettingsModule =
  SettingsPage
  + SettingsTable
  + TemplatePicker
  + DocumentRuleEditor
  + EmailTemplatePicker
  + RuleDryRunPreview
```
