# Agent Contract

## Purpose

Rules for AI agents and developers generating ERP UI code.

**Index:** [`README.md`](./README.md)

Read [`anti-patterns.md`](./anti-patterns.md) before writing any container or layout.
Read [`ui-system.md`](./ui-system.md) before writing any component, page, or module.

---

## Hard Bans — Never Generate These

```
❌ <Card> inside <Card> or <SectionCard>
❌ <SectionCard> inside <SectionCard>
❌ border or shadow-sm on Card, StatCard, CrudMainView, SectionCard, SplitView outer
❌ bg-background on layout containers or page wrappers
❌ gradient backgrounds on cards, stat blocks, or page headers
❌ import { ... } from '@phosphor-icons/react'  — always use @/lib/icons
❌ window.alert() or window.confirm()
❌ Custom table markup — always use CrudTable / CrudMainView
❌ Custom form field layouts — always use EntityForm
❌ Custom status badge / colored div for status — always use StatusBadge
❌ Ad-hoc formatMoney or Intl.NumberFormat for currency — use MoneyText
❌ Hard-coded hex or Tailwind raw colors (text-blue-500, bg-rose-200, etc.)
❌ text-4xl, text-3xl, text-2xl in ERP module UI
❌ rounded-xl, rounded-2xl, or rounded-3xl on content surfaces (use rounded-card)
❌ rounded-lg on named surfaces (use rounded-card / rounded-control)
❌ Select / Radix select in apps/web — use Combobox
❌ border border-input bg-background on inputs — use bg-muted/60 filled style
❌ Multiple variant="cta" buttons in the same toolbar/header strip
❌ variant="cta" on full-page route form submit (use variant="default")
❌ variant="default" on Dialog Save/Create — use variant="cta" or EntityForm surface="dialog"
❌ AlertDialogAction without variant="destructive" on delete flows
❌ <TooltipProvider> inside any component (already in AppLayout)
❌ Arbitrary spacing values (mt-7, px-11, mb-[13px])
❌ Manually constructed alert / notice divs (use InfoBox)
❌ Icon-only buttons without a Tooltip
❌ Status colors invented per-module (use StatusBadge + variantMap)
❌ onClick / role="button" on elements without hover + active/focus affordance (see visual-foundation.md § Interactive Affordances)
❌ Manual Button spinners — use `<Button loading>`
❌ Field error text without invalid ring on the control (use FormField / EntityForm errors)
❌ valid / success ring on every non-empty input — only explicit confirmation
```

---

## Required Patterns Per Page Type

### List Page

```tsx
// CrudMainView includes ModulePage header — do not wrap in a second ModulePage
<CrudMainView
  title="Clients"
  icon={clientsPageIcon()}
  subtitle="…"
  headerActions={<PageHeaderCtaLink to="/clients/new">New client</PageHeaderCtaLink>}
  columns={clientColumns}
  rows={filteredRows}
  sort={sort}
  onSortChange={setSort}
  entityLabel="client"
  getRowHref={(c) => `/clients/${c.id}`}
  isLoading={isLoading}
  emptyTitle="No clients found"
  exportOptions={{ fileName: 'clients', label: 'Export' }}
  allRows={allRows}
/>
```

The header CTA is the **one** `variant="cta"` on the page. Dialog Save/Create inside this page also use `cta`; full-page create routes use `default` on submit.

Loading: pass `isLoading` to `CrudMainView` or use `PageSkeleton` at page level — do not hand-roll table skeletons.

### Detail Page

```tsx
// Simple entity (≤ 4 sections, no sub-entity lists)
<ModulePage title={entity.name} icon={userRecordPageIcon()} backTo="/users" actions={…}>
  <DetailView
    title="User details"
    fields={[ … ]}
  />
</ModulePage>

// Complex entity / workspace (sub-entities, timeline, parties)
<ModulePage title={entity.name} icon={casesPageIcon()} backTo="/cases" actions={…}>
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="[domain]">[Domain]</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="[Metric 1]" value={...} />
          <StatCard label="[Metric 2]" value={...} />
          <StatCard label="[Metric 3]" value={...} />
        </div>
        <SectionCard title="Recent Activity">
          <Timeline events={recentEvents} />
        </SectionCard>
        <SectionCard title="[Sub-entity group]" actions={<Button size="sm" variant="outline">Add</Button>}>
          {items.slice(0, 5).map((item) => (
            <ListRow key={item.id} title={item.name} subtitle={item.role} trailing={<StatusBadge status={item.status} />} />
          ))}
          {items.length === 0 && <InlineEmptyState text="No items yet." centered />}
        </SectionCard>
      </div>
    </TabsContent>
  </Tabs>
</ModulePage>
```

### Create / Edit Page

```tsx
<ModulePage title="New client" icon={clientsPageIcon()} backTo="/clients">
  <EntityForm<FormValues>
    fields={formFields}
    defaultValues={defaultValues}
    submitLabel="Create client"
    onSubmit={handleSubmit}
  />
</ModulePage>
```

Submit on full-page routes: `variant="default"`. In dialogs: `<EntityForm surface="dialog">` → submit `variant="cta"`.

### Backend validation → form states

Return field-keyed plain-text messages. Frontend maps to `EntityForm errors`:

```tsx
<EntityForm errors={{ email: 'Already registered', vatId: 'Invalid VAT number' }} … />
```

`FormField` applies invalid ring + `aria-invalid` on the control. Do not return HTML error snippets.

### Settings Page

```tsx
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';

<ModulePage title="Settings" layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}>
  <AppSectionNavLayout items={settingsNav} activeKey={activeSection} onSelect={setActiveSection}>
    {activeSection === 'general' && (
      <SettingsSection title="General" description="...">
        <SettingsRow label="[Setting name]" description="[Why this setting exists]">
          <Switch checked={value} onCheckedChange={setValue} />
        </SettingsRow>
      </SettingsSection>
    )}
  </AppSectionNavLayout>
</ModulePage>;
```

See [`section-nav.md`](./section-nav.md) for scroll behavior, purple active state, and app sidebar compact rules.

---

## Module File Structure

Every module must follow this layout. No deviation.

```
modules/[name]/
├── [Entity]ListPage.tsx      // CrudMainView — filter, sort, paginate, export
├── [Entity]CreatePage.tsx    // ModulePage + EntityForm
├── [Entity]DetailPage.tsx    // ModulePage + DetailView or Tabs
└── shared.tsx                // columns, formFields, rowActions, defaultValues
```

All column definitions, form field arrays, and row actions live in `shared.tsx`.
Never define these inline in a page component.

---

## Design Tokens — CSS Variables

All design dimensions are centralized in `apps/web/src/styles/globals.css` and extended in `tailwind.config.ts`. Change there, everything updates.

```css
--radius-card: 0.75rem; /* rounded-card — surface containers */
--radius-control: 0.625rem; /* rounded-control — inputs, buttons */
--radius-badge: 0.375rem; /* rounded-badge — badges, chips */
--shadow-card: none; /* cards are flat on the page wash */
--shadow-elevated: … /* dialogs, popovers, dropdowns only */;
```

```tsx
// ✅ Semantic radius
<div className="rounded-card bg-card">     // surface tile
<button className="rounded-control …">    // control

// ❌ Banned on named surfaces
<div className="rounded-lg …">
<div className="rounded-xl …">
```

---

## Component Token Rules

### Colors

Always use semantic tokens. Reject any generation that uses raw Tailwind palette colors.

```tsx
// ✅ Required
className = 'text-foreground bg-background border-border';
className = 'text-muted-foreground';
className = 'text-destructive';

// ❌ Banned
className = 'text-gray-700 bg-white border-gray-200';
className = 'text-red-500';
className = 'bg-blue-50 border-blue-200';
```

### Typography

```tsx
// ✅ Page title (one per page, in ModulePage title prop)
title="Module Name"

// ✅ Card / SectionCard title (prominent section header)
<CardTitle>Section name</CardTitle>
<SectionCard title="Section name">

// ✅ Field group label (quiet organizer)
<p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
  Group label
</p>

// ✅ Body text
<p className="text-sm text-foreground">Content</p>

// ✅ Meta / secondary text
<p className="text-xs text-muted-foreground">Last updated 2 hours ago</p>

// ❌ Banned in ERP modules
<h1 className="text-4xl font-bold">...</h1>
<h2 className="text-2xl font-semibold">...</h2>
<p className="text-lg">...</p>
```

### Spacing

```tsx
// ✅ Between page blocks
<div className="space-y-4">

// ✅ Between sections
<div className="space-y-6">

// ✅ Inside form fields
<div className="space-y-1.5">
  <Label>Name</Label>
  <Input />
</div>

// ✅ Button groups
<div className="flex gap-2">

// ❌ Banned
<div className="space-y-7">
<div className="mt-[22px]">
<div className="gap-[18px]">
```

---

## Hierarchy Rules (Summary)

```
App shell (bg-muted/40 page wash)
└── ModulePage content area
    ├── Card / StatCard / CrudMainView / EntityForm / DetailView   [rounded-card bg-card — no border, no shadow]
    │   └── SectionCard / CollapsibleSection                      [borderless — heading rule + spacing]
    │       └── ListRow / SettingsRow                             [transparent, optional dividers]
    │           └── Input / Badge / Button                        [bg-muted/60 inputs, no border]
    └── SplitView outer                                           [borderless; border-r between panes only]
```

**If a container is a white tile (`bg-card`), its children must NOT re-add borders or shadows for chrome.**

---

## Sub-Entity Management Pattern

The only acceptable pattern for managing sub-entity lists (parties, tasks, checklist items, events)
inside a detail page:

```tsx
<SectionCard
  title="Tasks"
  meta={`${tasks.length} items`}
  actions={
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <PlusIcon size={14} /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Create a task linked to this record.</DialogDescription>
        </DialogHeader>
        <EntityForm
          surface="dialog"
          showHeader={false}
          fields={taskFields}
          onSubmit={handleAddTask}
          submitLabel="Create"
        />
      </DialogContent>
    </Dialog>
  }
>
  {tasks.length === 0 ? (
    <InlineEmptyState text="No tasks yet." centered />
  ) : (
    tasks.map((task) => (
      <ListRow
        key={task.id}
        title={task.title}
        subtitle={`Due: ${task.dueDate} · ${task.assignee}`}
        trailing={<StatusBadge status={task.status} />}
      />
    ))
  )}
</SectionCard>
```

Never build:

- Custom modal markup per module
- Card per task item
- Inline editing directly in the row (use Dialog + EntityForm)

---

## Date Formatting

All user-visible dates must display as `DD.MM.YYYY`.

```tsx
// ✅ Correct — DatePicker handles display automatically
<DatePicker mode="date" value={date} onChange={setDate} />

// ✅ Correct — CrudTable date column
{ key: 'createdAt', header: 'Created', type: 'date' }

// ❌ Wrong — MMM d, yyyy display
{ key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString('en-US') }
```

Internal form state and API values: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`.
Never expose ISO format to users.

---

## What to Check Before Submitting Generated Code

Run through this list. If any item fails, fix it before considering the task complete.

1. No `<Card>` inside `<Card>` or `<SectionCard>`
2. No `border` or `shadow-sm` on page-anchored cards, SectionCard, CrudMainView, or SplitView outer
3. All icons imported from `@/lib/icons`
4. All form fields going through `EntityForm`
5. All list pages using `CrudMainView` / `CrudTable`
6. All status rendering through `StatusBadge`; currency through `MoneyText`
7. No raw color classes — only semantic tokens
8. No `window.alert()` or `window.confirm()`
9. No `<TooltipProvider>` inside components
10. No text above `text-xl` in ERP module UI
11. At most ONE `variant="cta"` in the page header strip. Dialog Save/Create = `cta`. Full-page form submit = `default`.
12. Icon-only buttons have `<Tooltip>`
13. Destructive actions have confirmation (ConfirmPopover / ConfirmActionDialog / AlertDialog)
14. Dates display as `DD.MM.YYYY` to the user
15. Columns, form fields, and row actions defined in `shared.tsx`, not inline in page
16. Every `ModulePage` / `CrudMainView` passes `icon={*PageIcon()}`
17. Every pressable control has hover + active/focus feedback (`cursor-pointer` is not sufficient alone)
18. Async buttons use `Button loading`; form errors use `EntityForm errors` / `FormField error` with invalid ring on controls (see `interactive-states.md`)

---

## Additional Rules From Component Audit

See this folder for the current audited list. Highlights:

### StatCard

Level 2 borderless surface — `rounded-card bg-card`, no border, no shadow.

### DashboardPage metric cards

Always use `StatCard`. Never raw `Card` with custom KPI layout.

### PageSkeleton / DetailSkeleton

Use for page-level loading — not bare `<Skeleton>` lines scattered in pages.

### Single TooltipProvider

Mounted once in `AppLayout`. Never duplicate in modules.
