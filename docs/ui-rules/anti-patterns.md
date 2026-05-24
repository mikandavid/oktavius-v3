# Anti-Patterns

## Purpose

Every pattern here was added because it appeared in real generated code or real design sessions.
Each anti-pattern breaks hierarchy, adds noise, wastes screen space, or creates inconsistency
that multiplies across modules. When in doubt, check this file before building.

---

## 1. Cards Inside Cards

**The most common AI-generated UI mistake in this codebase.**

Cards inside cards break the hierarchy system (see 02-hierarchy-system.md). They create
visual nesting that has no semantic meaning and makes the UI feel heavy, layered, and inconsistent.

```tsx
// ❌ Wrong — nested Card surfaces
<Card>
  <CardContent>
    <Card>  // Level 2 inside Level 2
      <CardContent>
        <Card>  // Level 2 inside Level 2 inside Level 2
          ...
        </Card>
      </CardContent>
    </Card>
  </CardContent>
</Card>

// ❌ Also wrong — SectionCard inside Card with extra wrapping
<Card>
  <CardContent>
    <SectionCard>  // OK up to here
      <SectionCard>  // Level 3 inside Level 3 — wrong
        ...
      </SectionCard>
    </SectionCard>
  </CardContent>
</Card>

// ✅ Correct — flat hierarchy
<Card>
  <CardContent>
    <SectionCard title="Group A">  // Level 3 inside Level 2
      <ListRow ... />
      <ListRow ... />
    </SectionCard>
  </CardContent>
</Card>

// ✅ Also correct — no container at all, just spacing + label
<Card>
  <CardContent className="space-y-4">
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      Group label
    </p>
    <ListRow ... />
    <ListRow ... />
  </CardContent>
</Card>
```

When the urge to nest cards appears, ask: what problem am I solving?

- Need to group related content? → Use spacing + field group label
- Need a bordered sub-region? → Use `SectionCard` inside `Card`, never another `Card`
- Need visual separation inside a `SectionCard`? → Use `border-t border-border/40` or spacing

---

## 2. Generic AI Dashboard Aesthetic

This ERP UI should look operational, not like a startup landing page or a SaaS demo.

**Avoid all of these:**

```
❌ Huge rounded cards (rounded-2xl, rounded-3xl)
❌ Gradient backgrounds on stat cards or page headers
❌ Decorative blobs, orbs, or radial gradient backgrounds
❌ Random pastel panel tints with no semantic meaning
❌ Marketing-style hero sections inside ERP modules
❌ Large decorative illustrations in empty states
❌ Multiple accent colors across the page for "visual interest"
❌ Frosted-glass effects on any surface
❌ Heavy drop shadows on cards or sections
❌ Oversized KPI numbers with no label context
```

**What the dashboard should look like:**

- `StatCard` row with 3–5 key metrics (small compact cards)
- `CrudTable` or `SectionCard` + `Timeline` below
- No decorative elements that aren't data or navigation

---

## 3. Multiple Custom List UIs Per Module

Every module that has a list of records should use `CrudMainView` → `CrudTable`.
Never build a custom card grid, custom table markup, or custom list layout for a simple entity list.

```tsx
// ❌ Wrong — custom list per module
<div className="grid grid-cols-3 gap-4">
  {clients.map((c) => (
    <div className="rounded-lg border p-4 shadow-sm">
      <h3>{c.name}</h3>
      <p>{c.status}</p>
    </div>
  ))}
</div>

// ✅ Correct
<CrudMainView
  title="Clients"
  columns={clientColumns}
  rows={clients}
  ...
/>
```

Exception: a list is strongly visual (images, spatial data) and a table genuinely doesn't fit.
Even then, justify the decision explicitly before building custom layout.

---

## 4. Page-Specific Status Colors

Never invent a status color for a specific module. Always map to semantic tokens.

```tsx
// ❌ Wrong — module-specific status colors
<Badge className="bg-purple-100 text-purple-700">Transferred</Badge>
<Badge className="bg-orange-100 text-orange-700">In Review</Badge>

// ✅ Correct — semantic mapping
<StatusBadge status="transferred" variantMap={{ transferred: 'info' }} />
<StatusBadge status="in_review" variantMap={{ in_review: 'warning' }} />
```

---

## 5. Primary Color on Everything Highlighted

The primary / CTA color must guide the user toward the one most important action.
When many elements compete for the primary color, it loses its value.

```tsx
// ❌ Wrong — primary color on multiple elements
<Button variant="cta">Save</Button>
<Badge className="bg-primary text-primary-foreground">Active</Badge>
<div className="bg-primary/10 border border-primary rounded-lg p-4">
  This section needs attention.
</div>

// ✅ Correct
<Button variant="cta">Save</Button>  // one CTA per region
<StatusBadge status="Active" />       // semantic success tone, not primary
<InfoBox tone="warning">             // semantic warning, not primary tint
  This section needs attention.
</InfoBox>
```

---

## 6. Arbitrary Spacing Values

Using arbitrary spacing breaks the rhythm and makes generated screens feel inconsistent.

```tsx
// ❌ Wrong — arbitrary values
<div className="mt-7 px-11 mb-[13px]">
<div className="gap-[18px]">
<p className="mb-3.5">

// ✅ Correct — from the spacing scale
<div className="mt-6 px-4 mb-3">
<div className="gap-4">
<p className="mb-3">
```

Use the 4px base scale only. See 01-visual-foundation.md.

---

## 7. Forms Where Every Field Has Its Own Card

EntityForm provides section grouping. Do not wrap individual fields or small field groups
in their own bordered cards.

```tsx
// ❌ Wrong — per-field cards
<Card><CardContent>
  <Label>Name</Label>
  <Input />
</CardContent></Card>
<Card><CardContent>
  <Label>Email</Label>
  <Input />
</CardContent></Card>

// ✅ Correct — EntityForm with sections
<EntityForm
  fields={[
    { name: 'name', label: 'Name', type: 'text', section: 'Identity' },
    { name: 'email', label: 'Email', type: 'email', section: 'Identity' },
  ]}
  ...
/>
```

---

## 8. One-Off Inline Alerts

Never hand-craft an alert or notice box when a shared component exists.

```tsx
// ❌ Wrong — custom alert div
<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
  <span>⚠ This record has pending approvals.</span>
</div>

// ✅ Correct
<InfoBox tone="warning">This record has pending approvals.</InfoBox>
```

---

## 9. Raw window.alert / window.confirm

Never use browser-native `alert()` or `confirm()`.

```tsx
// ❌ Wrong
if (window.confirm('Delete this?')) { ... }

// ✅ Correct
<ConfirmPopover
  title="Delete this record?"
  onConfirm={handleDelete}
  trigger={<Button variant="destructive" size="sm">Delete</Button>}
/>
```

---

## 10. Large Modal Workflows

A Dialog is for focused, bounded interactions. When a workflow has 3+ steps, complex state,
or requires navigating between sections, it must be a full page route.

```
❌ Dialog with 4 tabs and 20+ fields
❌ Dialog that opens another Dialog
❌ Dialog that replaces a full management screen

✅ Simple entity creation → Dialog + EntityForm (small-medium records)
✅ Complex multi-step creation → StepperLayout on a full page
✅ Module configuration → SettingsLayout on a full page
```

---

## 11. Shadow on Inner Surfaces

Only **floating overlays** use shadow (`shadow-elevated`): dialogs, popovers, dropdowns, tooltips.

Page-anchored surfaces are flat — no shadow on cards, sections, tables, or sidebars.

```tsx
// ❌ Wrong — shadow on SectionCard or table container
<SectionCard className="shadow-sm"> ... </SectionCard>
<div className="shadow-sm rounded-lg border">
  <CrudTable ... />
</div>

// ✅ Correct — borderless white tile
<SectionCard> ... </SectionCard>
<CrudMainView … />  // rounded-card bg-card, no shadow
```

---

## 12. Hardcoded Visible Strings

All user-visible text must be a string literal ready for translation.
Never construct visible labels dynamically in a way that breaks i18n structure.

```tsx
// ❌ Wrong — dynamic string concatenation in visible label
<Button>{action + ' ' + entity}</Button>

// ✅ Correct — explicit strings (even if i18n is not active yet)
<Button>Delete client</Button>
```

---

## 13. Import Icons Directly from @phosphor-icons/react

Always go through `@/lib/icons`. The lib provides aliases, tree-shaking, and future-proofing.

```tsx
// ❌ Wrong
import { Plus, Trash, PencilSimple } from '@phosphor-icons/react';

// ✅ Correct
import { PlusIcon, DeleteIcon, EditIcon } from '@/lib/icons';
```

---

## 14. Using bg-background on Layout Containers

`bg-background` is 100% white. It is reserved for surfaces (Level 2+) and interactive inputs.
Layout containers must inherit the grey body background, not be forced white.

```tsx
// ❌ Wrong — forces entire layout to white
<div className="bg-background min-h-screen">
  <AppLayout>

// ✅ Correct — body CSS sets the background; layout inherits
<AppLayout>  // no bg class needed
```

---

## 15. Equal Spacing Between All Elements

Related elements must sit closer together than unrelated elements. Equal spacing everywhere
destroys grouping signals and makes the UI hard to scan.

```tsx
// ❌ Wrong — everything at space-y-4 regardless of relationship
<div className="space-y-4">
  <Label>Name</Label>
  <Input />
  <Label>Email</Label>
  <Input />
  <Separator />
  <SectionTitle>Address</SectionTitle>
  <Label>Street</Label>
  <Input />
</div>

// ✅ Correct — EntityForm handles this via sections. If manual:
<div className="space-y-6">  // between sections
  <div className="space-y-1.5">  // label + input
    <Label>Name</Label>
    <Input />
  </div>
  <div className="space-y-1.5">
    <Label>Email</Label>
    <Input />
  </div>
</div>
```

---

## 16. TooltipProvider Duplication

`TooltipProvider` is already mounted once in `AppLayout`. Never add another one
inside a component, page, or module.

```tsx
// ❌ Wrong
function MyComponent() {
  return (
    <TooltipProvider>
      <Tooltip>...</Tooltip>
    </TooltipProvider>
  );
}

// ✅ Correct — just use Tooltip directly
function MyComponent() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>...</TooltipTrigger>
      <TooltipContent>Label</TooltipContent>
    </Tooltip>
  );
}
```
