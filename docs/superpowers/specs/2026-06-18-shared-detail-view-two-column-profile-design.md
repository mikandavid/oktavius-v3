# Shared DetailView — Two-Column Record Profile

**Date:** 2026-06-18
**Branch:** FE
**Status:** Design approved, pending spec review

## Problem

The shared `DetailView` (`apps/web/src/components/common/DetailView.tsx`) renders
every record's detail page as a single stacked card: an identity band, a primary
hero, then section-grouped label/value pairs, then a meta footer. Because it's one
long vertical column of `label → value` rows, it reads like a **read-only form**
rather than a record profile. Every module that uses `DetailView` inherits this
feel.

We want detail pages to read like a **record profile** — substance in a main
column, identity/key-facts/metadata pulled aside into a rail — without forcing
each module to change its `fields[]` config.

## Goals

- Reshape the shared `DetailView` into a **two-column record profile**: a flexible
  main column for sectioned content and a fixed-width rail for identity, key facts,
  and metadata.
- **Zero per-module work** for the default result: the new layout is derived from
  props modules already pass (`visual`, `importance`, `section`).
- Provide an opt-in escape hatch (`placement`) for modules that want to tune which
  fields land in the rail.
- Degrade gracefully to the current single-column layout for records that have no
  identity/primary/meta content, so nothing regresses.
- Land the improvement at the shared level so all current call sites benefit.

## Non-Goals

- The **list** view. `CrudListShell` / the data grid is explicitly out of scope
  (the master–detail list redesign is a separate, now-superseded direction —
  see "Relationship to other specs").
- Related-records / activity feeds / tabs. Records show their own fields only;
  no new relationship surfaces (deferred — YAGNI).
- Changes to any module's data hooks, REST API, or `fields[]` data.
- Inline editing changes beyond what `InlineEdit` already supports.
- Moving record actions (Edit/Delete) — they stay in the `ModulePage` header.

## Build Approach

Rewrite the **body** of the shared `DetailView`; keep its public props
backward-compatible. Compose existing base-ui primitives rather than inventing a
layout system:

- **Two sibling `SectionCard` tiles** in a CSS grid — a main tile and a rail tile.
  They are siblings, **not** nested, so the no-cards-in-cards rule holds; both sit
  as borderless white tiles on the tinted page wash (current V3 surface aesthetic).
- Reuse `RecordIdentity` (rail header), `DetailFieldGrid` (main sections),
  `RecordInfoMeta` (rail footer).
- Add one small base-ui primitive, **`RecordKeyFacts`** — a compact _stacked_
  label/value renderer sized for the ~20rem rail. (The existing `RecordInfoHero`
  is a 3-column grid, wrong for a narrow rail.)

Actions (Edit/Delete) remain in the `ModulePage` header where every page in the
app puts them; the rail is purely informational.

## Layout

Inside `DetailView`:

```
lg:grid-cols-[1fr_20rem], gap between tiles
┌──────────────────────────────┬───────────────────┐
│ MAIN tile (SectionCard)       │ RAIL tile          │
│  ▸ Section heading            │  RecordIdentity    │
│    DetailFieldGrid (2-col)    │   (avatar+name+    │
│  ▸ Section heading            │    type badge)     │
│    DetailFieldGrid            │  ── divider ──     │
│   …divider-separated sections │  RecordKeyFacts    │
│                               │   (primary fields) │
│                               │  ── divider ──     │
│                               │  RecordInfoMeta    │
│                               │   (meta fields)    │
└──────────────────────────────┴───────────────────┘
```

### Responsive

`grid-cols-1` below `lg`. The **rail tile renders on top** (identity-first reading
on mobile), main tile below. Achieved by DOM order + `lg:` grid placement so the
rail visually sits right on desktop and on top on mobile.

### Degradation

If the record has no identity (`visual`), no `primary` fields, and no `meta`
fields (and nothing explicitly `placement: 'aside'`), the rail would be empty — in
that case the main tile renders **full-width, single-column**, identical to today.

## Field-Mapping API

No module changes its `fields[]`. Mapping is derived:

| Source                                            | Lands in                       |
| ------------------------------------------------- | ------------------------------ |
| `visual` + `identityTitle/Subtitle/Meta/Trailing` | Rail — `RecordIdentity`        |
| field `importance: 'primary'`                     | Rail — `RecordKeyFacts`        |
| field `importance: 'meta'`                        | Rail — `RecordInfoMeta` footer |
| default-importance fields, grouped by `section`   | Main column                    |

### Escape hatch

Add an optional field prop:

```ts
placement?: 'main' | 'aside';
```

- Defaults derive from `importance` (primary/meta → aside, default → main), so it
  is opt-in only.
- `placement: 'aside'` pulls a default field into the rail; `placement: 'main'`
  pushes a primary field into the main column. This lives on the **app-level**
  `DetailFieldProps` extension in `DetailView.tsx` (alongside the existing
  `permission` and `inlineEdit` extensions), not the base-ui type.

### Contacts mapping (reference)

avatar + name + Business/Person badge → rail identity; email/phone/mobile
(`primary`) → rail key facts; General / Address / Web / Classification / Notes
sections → main column. No change to `ContactDetailView`'s field config.

## Components

- **base-ui** `packages/base-ui/src/components/detail-field.tsx` — add
  `RecordKeyFacts({ fields })`: stacked compact label/value list (label tier +
  body/highlight value tier), optional leading icon per field, max ~8 items.
  Exported from the package barrel.
- **app** `apps/web/src/components/common/DetailView.tsx` — rewrite body to the
  two-tile grid; add `placement` to the extended `DetailFieldProps`; implement the
  rail/main partition + empty-rail → full-width degradation. Public component props
  unchanged.

## Blast Radius (all inherit the new layout)

- `modules/contacts/ContactDetailView.tsx` — reference; browser-verify.
- `components/detail/EntityDetailWorkspaceTabs.tsx` — verify it still composes
  inside a tabbed workspace.
- `modules/showcase/sections/DetailLayoutSection.tsx` + `showcase/shared.tsx` —
  update demos to show the two-column profile **and** the single-column
  degradation case.

## Error Handling & Edge Cases

- **No `visual`:** rail has no identity block; rail still renders if there are
  primary/meta/aside fields, else degrades to full-width single column.
- **Only sectioned fields (no primary/meta/identity):** full-width single column —
  byte-for-byte the current experience; guards against regressions.
- **Permission-filtered fields:** existing `permission` filtering runs _before_
  partitioning, so a field hidden by permission never reaches either column.
- **`InlineEdit` fields:** unchanged; an inline-editable field keeps its control
  whether it lands in the rail or main.
- **Long rail values:** truncate/wrap within the fixed rail width; never force
  horizontal scroll on the page.

## Testing

TDD via the implementation plan. Unit-test the partition logic in `DetailView`:

- `primary` → rail, `meta` → rail footer, default+`section` → main grouping.
- `placement: 'aside'` / `placement: 'main'` overrides win over importance default.
- Empty-rail (no identity/primary/meta/aside) → full-width single column.
- Permission-filtered fields excluded before partitioning.
- Existing contact tests stay green; add a `ContactDetailView` render test
  asserting email/phone/mobile appear in the rail region and address fields in main.
- Browser-verify Contacts detail + showcase (both layouts).

## Relationship to Other Specs

This **supersedes** `2026-06-18-contacts-master-detail-redesign-design.md` (a
bespoke, contacts-only master–detail list redesign). That spec was approved by a
parallel stream but never implemented (no components, no plan). The two are
architecturally incompatible: it avoids shared-component changes and rebuilds the
list; this changes the shared detail default and leaves the list untouched. Per
the 2026-06-18 decision, we proceed with this shared design and flag the
master–detail spec as superseded for the other stream.
