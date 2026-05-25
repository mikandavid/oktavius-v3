# Component Guide

## Purpose

Decision trees for choosing the right component. Agents and developers must consult this
before building any UI element. If the pattern exists here, use it exactly. If it doesn't
exist here, it may not need to be built — check anti-patterns first.

---

## Container / Surface Selection

```
What am I building?
│
├── A page with multiple major topic areas (cases, projects, clients with sub-entities)
│   └── ModulePage + Tabs → each tab contains SectionCard(s)
│
├── A simple entity detail page (users, contacts, basic records)
│   └── ModulePage + DetailView → flat sections in one scroll
│
├── A list of records
│   └── ModulePage + CrudMainView (header + FilterToolbar + CrudTable + Pagination)
│
├── A create or edit flow
│   ├── Simple (≤ 12 fields, single domain) → ModulePage + EntityForm
│   └── Complex (multi-step, multi-domain) → ModulePage + StepperLayout
│
├── A settings page
│   └── ModulePage + AppSectionNavLayout + SettingsSection + SettingsRow
│
├── A dashboard
│   └── ModulePage + StatCard row + SectionCard(s) with charts/lists
│
└── A group of content inside an existing page
    ├── Major content section → SectionCard
    ├── Sub-entity list (parties, tasks, events) → SectionCard + ListRow(s)
    ├── Optional/collapsible fields → CollapsibleSection
    ├── Master-detail layout → SplitView
    └── Never a Card inside another Card
```

---

## When to Use Tabs vs Stacked Sections

**Use Tabs when:**

- The entity has 3+ major domains of data (e.g. Overview, Parties, Documents, Settings)
- Each domain has enough content to fill a screen on its own
- Switching between domains is a common workflow step
- The record is a workspace the user returns to repeatedly

**Use stacked SectionCards when:**

- The entity is simple (users, contacts, basic config records)
- All relevant information fits in a single scroll without confusion
- The record is viewed more than edited
- There are fewer than 4 logical groups

**Never use Tabs for:**

- 2 options (use a segmented control or just two SectionCards)
- A choice between form and preview (use a toggle or inline mode)
- Filter switching in a list (use FilterToolbar)

---

## Card vs SectionCard vs ListRow vs DetailView

| Need                                          | Use                                                       | Don't Use                        |
| --------------------------------------------- | --------------------------------------------------------- | -------------------------------- |
| Content surface floating on page body         | `Card` (Level 2)                                          | Raw `div` with manual border     |
| Content section inside a detail page or modal | `SectionCard` (Level 3)                                   | `Card` inside `Card`             |
| Sub-entity items (parties, tasks, events)     | `ListRow` inside `SectionCard`                            | `Card` per item                  |
| Read-only field display for a record          | `DetailView`                                              | Custom field-row divs            |
| KPI metric                                    | `StatCard`                                                | Custom `Card` with manual layout |
| "No items" inside a SectionCard               | `InlineEmptyState`                                        | Custom styled paragraph          |
| "No records" for a whole list page            | `EmptyState`                                              | `InlineEmptyState` at page level |
| Long/optional form field groups               | `CollapsibleSection`                                      | Always-expanded accordion        |
| List left + detail right layout               | `SplitView`                                               | Custom flex layout per module    |
| Settings page navigation                      | `AppSectionNavLayout` + `SettingsSection` + `SettingsRow` | Raw `SettingsLayout` in apps/web |

---

## Data Display Selection

```
What am I displaying?
│
├── A list of records the user manages (sortable, filterable, paginated)
│   └── CrudTable via CrudMainView
│
├── A flat detail record (read-only field display)
│   └── DetailView with sections
│
├── Sub-entity items within a detail page (parties, tasks, files)
│   └── SectionCard + ListRow per item
│   (Use CrudTable only if the sub-list needs independent sort/pagination)
│
├── KPI / metric numbers on a dashboard
│   └── StatCard row (3–5 cards)
│
├── Audit trail / activity events
│   └── Timeline
│
├── File attachments
│   └── AttachmentList
│
├── Status information
│   ├── In a table column → type: 'status' column + StatusBadge
│   ├── Inline near text → StatusBadge
│   └── With a count → StatusDotLabel
│
├── Currency / money values
│   ├── In display context → MoneyText
│   └── In table column → type: 'currency' column
│
├── Timestamps / dates
│   ├── Absolute (document dates) → formatted via DatePicker display (DD.MM.YYYY)
│   └── Relative (feed, activity) → RelativeTime
│
└── Entity avatar / initials
    └── Avatar with avatarInitials()
```

---

## Form Selection

**EntityForm** — use for all create and edit flows.

- Handles all 13 field types (text, email, number, textarea, select, combobox, multiselect,
  tags, checkbox, switch, date, datetime, time, currency, relation, file)
- Built-in section support, validation, loading/saving states
- 2-column grid by default; `colSpan: 2` for wide fields

**Do not build manual form layouts.** If EntityForm does not support a field type you need,
add the field type to EntityForm rather than working around it.

### Form Layout Rules

```
Default:          2-column grid (gap-4)
Wide fields:      colSpan: 2 (notes, textarea, rich text)
Mobile:           1-column (EntityForm handles this automatically)
Field sections:   use the `section` property — creates visual groups
Boolean fields:   checkbox/switch — label is inline with control, no outer Label wrapper
```

### When to Use StepperLayout

Use multi-step wizard (StepperLayout) when:

- The create flow has 3+ distinct phases with different data domains
- Early steps determine which fields appear in later steps
- The process has a meaningful review step before submission
- The workflow is infrequent (onboarding, case creation, contract setup)

Do not use StepperLayout for:

- Simple records with many fields (use one EntityForm with sections)
- Settings configuration (use `AppSectionNavLayout` — see `section-nav.md`)
- Filtering or search (use FilterToolbar)

---

## Action / Button Selection

```
What action is this?
│
├── List header “New X” → PageHeaderCtaLink / PageHeaderCtaButton — variant="cta" size="sm" (one per page header)
├── Dialog Save / Create → variant="cta" (EntityForm surface="dialog" or DialogFormFooter)
├── Dialog Cancel / Back / dismiss → variant="ghost"
├── Full-page form submit → variant="default"
├── Secondary action (export, filter, secondary navigation) → variant="outline" size="sm"
├── Toolbar / icon action → variant="ghost"
├── Destructive / delete → variant="destructive" + confirmation
└── Semantic state action (connect, approve, flag) → variant matching state
```

### Confirmation Patterns

```
How destructive is this?
│
├── Row-level delete (recoverable or low-stakes) → ConfirmPopover (inline, no page block)
├── Module-level delete or medium-stakes irreversible → ConfirmActionDialog
└── Critical irreversible action (mass delete, purge, permanent revoke) → AlertDialog
```

### Button Placement Rules

- At most ONE `variant="cta"` in the **page header strip** (list “New X”). Dialog Save/Create also use `cta`. Full-page form submit uses `default`.
- Destructive actions must be visually separated from standard actions (use `Separator` or spacing).
- In Dialog footers: cancel left, primary action right (`flex justify-end gap-2`).
- Bulk actions: appear only when rows are selected — not always visible in the toolbar.
- Icon-only buttons must always have a `Tooltip`.

---

## Feedback / Notification Selection

```
What kind of feedback is this?
│
├── Action result (save succeeded, error, delete completed)
│   └── toast — from @/lib/toast
│
├── Persistent contextual warning or info inside a page section
│   └── InfoBox (tone: info / success / warning / destructive)
│
├── Page-level persistent notice (maintenance, trial expiry, system alert)
│   └── AlertBanner — mounted ABOVE ModulePage, spans full width
│
├── Inline "empty section" inside a SectionCard
│   └── InlineEmptyState
│
├── Page-level "no records" state
│   └── EmptyState with title, description, optional action button
│
└── Page loading state
    ├── List pages → PageSkeleton
    └── Detail pages → DetailSkeleton
```

### Toast Rules

- Use `toast.success` for completed actions (save, create, delete confirmed).
- Use `toast.error` for failed server actions — also show error in form context if field-specific.
- Use `toast.warning` for non-blocking warnings (expiry, capacity).
- Use `toast.info` for neutral state changes (selection, mode switch).
- Use `toast.promise` for async operations with loading/success/error states.
- Never use `alert()`. Never place a persistent toast for messages that belong in InfoBox.

---

## Navigation Selection

```
What navigation element is this?
│
├── Current location in a hierarchy → Breadcrumb (above page title on detail pages)
├── Major sections within a detail workspace → Tabs + TabsList + TabsTrigger
├── Settings categories → AppSectionNavLayout (section nav + content panel; compacts app sidebar)
├── Related entity quick-switch → SplitView sidebar
└── Global module navigation → Sidebar (do not rebuild this per module)
```

---

## Overlay Selection

```
What overlay is this?
│
├── Form for creating or editing a sub-entity (small-medium) → Dialog + EntityForm
├── Multi-field confirm with context → Dialog
├── Blocking irreversible confirmation → AlertDialog
├── Inline lightweight confirmation → ConfirmPopover
├── Hover label on icon button → Tooltip
├── Context/action menu on row → DropdownMenu
└── Large workflow / multi-step process → should be a full page, not a modal
```

### Dialog Rules

- Dialog title must be present and describe the action.
- Primary confirm in footer: `variant="cta"` (Save / Create) — Cancel stays `ghost`.
- Destructive action in the footer must be `variant="destructive"` and separated.
- Do not put a full module page inside a Dialog. Large workflows get a route.

---

## Loading State Selection

| Context                      | Component                                            |
| ---------------------------- | ---------------------------------------------------- |
| List page loading            | `PageSkeleton`                                       |
| Detail page loading          | `DetailSkeleton`                                     |
| Button async action          | `disabled` + spinner icon on button                  |
| Table row action in progress | disable the row action, show inline spinner          |
| Section content loading      | `DetailSkeleton` (compact form) inside `SectionCard` |

Never use bare `<Skeleton>` lines scattered at page level. Compose via `PageSkeleton` / `DetailSkeleton`.

---

## Icon Rules

Always import from `@/lib/icons`, never from `@phosphor-icons/react` directly.

```tsx
// ✅ correct
import { PlusIcon, EditIcon, DeleteIcon } from '@/lib/icons';

// ❌ wrong — direct import
import { Plus } from '@phosphor-icons/react';
```

Icon size defaults:

- Default UI icon: `size={16}`
- Inside buttons with text: `size={14}` or `size={16}`
- Page / module identity icon shell: `size={20}` inside a `40px` container
- Status icons in badges: `size={12}`

Icons support text — they do not replace it unless the action is universally familiar
and the button has a Tooltip.
