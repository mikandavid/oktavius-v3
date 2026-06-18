# Contacts Module — Master–Detail Redesign

**Date:** 2026-06-18
**Branch:** FE
**Status:** Design approved, pending spec review

## Problem

The contacts module currently reuses the generic CRUD shell (`CrudListShell` →
`CrudTable` virtualized data grid) with separate full-page detail and form views
reached via query params. It reads like an admin spreadsheet, not a contacts
page. We want the familiar **master–detail "contacts app" feel**.

## Goals

- Replace the generic data-grid list with a two-pane master–detail layout.
- Make the list feel like a contacts app: avatars, alphabetical grouping with
  sticky letter headers, a muted sub-line per row.
- Inline create/edit/detail — never leave the contacts screen on desktop.
- Preserve existing capabilities: type & category filters, multi-select + bulk
  delete, avatars (with room for uploaded photos later), and quick actions
  (email / call / copy) on the detail pane.

## Non-Goals

- Server-side pagination. The data layer still fetches one page of 100 and
  filters client-side (pre-existing documented limitation in
  `useContactsData.ts`). Out of scope; remains a separate follow-up.
- Uploaded contact photos (avatar component should leave room for them, but
  upload is not built here).
- Changes to the contacts REST API or data hooks.

## Build Approach

Build **bespoke contacts components** rather than bending the shared
`CrudListShell` into a split layout (which would pollute a component every other
module depends on). Reuse:

- **Data hooks unchanged:** `useContacts`, `useContact`, `useContactCategories`,
  `useContactMutations` (`src/modules/contacts/data/useContactsData.ts`).
- **base-ui primitives:** `Avatar`, `Badge`/`StatusBadge`, `Button`, form
  fields, `cn`.
- **Existing field/column config** in `shared.tsx` where it still applies
  (field groups for the inline form, type variant map, search fields).
- **`ModulePage`** for page chrome (title, icon, "New contact" CTA).
- **`ConfirmActionDialog`** for delete confirmation (no native confirm — per
  standing project rule).

## Layout

Single two-pane split view inside `ModulePage`.

### Left pane (~320–360px fixed width)

- Search box (filters list live across name/email/phone/mobile/city).
- Filter row: type (business/person) + category multi-select.
- Optional selection-mode toggle → reveals row checkboxes for multi-select +
  bulk delete.
- Scrollable list, sorted A–Z by name, grouped with **sticky letter headers**
  (A, B, C…). Each row: avatar (colored initials; org vs person fallback icon) +
  name + muted sub-line (e.g. `Business · Berlin`, `Person · Sales`).
- Selected row highlighted.

### Right pane (fills remaining width)

Three inline states, swapped in place:

- **detail** (read) — default when a contact is selected.
- **edit** — inline form for the selected contact.
- **new** — inline blank form, no selection.
- **empty** — when nothing selected: "Select a contact" placeholder.

### Responsive

Below a breakpoint the panes stack: list fills the screen; tapping a contact
pushes the detail over it with a back button. Edit/new likewise full-width.

## State & URL

Selection + mode live in the URL query — same contract `ContactsPage` already
routes on, so the data hooks and the `useContact` `placeholderData` cache keep
working:

| URL                         | State                                 |
| --------------------------- | ------------------------------------- |
| _(none)_                    | list + empty right pane               |
| `?id=<contactId>`           | contact selected, detail mode         |
| `?id=<contactId>&mode=edit` | edit form inline in right pane        |
| `?mode=new`                 | new-contact form inline, no selection |

## Components

- **`ContactsSplitView`** — shell. Reads URL state, owns layout + responsive
  behavior, renders left + right panes.
- **`ContactListPane`** — search, filters, selection mode, alphabetical grouping
  with sticky headers, row rendering, navigation on row click.
- **`ContactDetailPane`** — read view: avatar header + type badge; quick actions
  (email `mailto:`, call `tel:`, copy to clipboard); grouped fields
  (General / Address / Web / Classification / Notes); Edit + Delete.
- **`ContactEditPane`** — inline create/edit form. Reuses field config from the
  existing form view, hosted in the pane instead of a full page. Discard guard
  on cancel with unsaved changes.
- **Helpers:** `contactGrouping.ts` (sort + group by first letter), avatar
  color/initials util.

`ContactsListView`, `ContactDetailView`, and `ContactFormView` are replaced.
Reusable config in `shared.tsx` is kept and imported by the new panes.

## Error Handling & Edge Cases

- **Loading:** list shows skeleton rows; right pane shows a spinner when a
  deep-linked contact is still fetching (placeholderData renders instantly when
  the contact is already in the list cache).
- **Empty — no contacts:** friendly empty state + "New contact" CTA.
- **Empty — no search/filter match:** "No contacts match."
- **Delete:** `ConfirmActionDialog`, then clear selection and return right pane
  to empty/next state. Bulk delete confirms count.
- **Inline edit cancel with unsaved changes:** discard-changes guard
  (`DiscardChangesDialog`), no native confirm.

## Testing

- List grouping (sort + sticky-header bucketing), live search, type/category
  filters.
- Selection mode: select/deselect, bulk delete confirm flow.
- Inline edit: save (mutation + invalidate), cancel with/without changes.
- URL-state ↔ pane-mode mapping (none / id / id+edit / new).
- Detail quick actions render correct `mailto:` / `tel:` / copy.
- Responsive stack toggle behavior.

## Out-of-scope Limitation Note

Only the first 100 contacts (by created_at desc) are loaded; alphabetical sort
and search operate over that set. This matches current behavior and is called
out so the redesign doesn't imply full-dataset coverage.
