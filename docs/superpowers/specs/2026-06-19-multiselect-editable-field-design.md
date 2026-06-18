# MultiSelect → inline chips + typeahead field

**Date:** 2026-06-19
**Component:** `packages/base-ui/src/components/multi-select.tsx`
**Status:** Design approved, pending implementation plan
**Related:** [Combobox editable field](2026-06-18-combobox-editable-field-design.md) — this applies the same pattern to multi-select.

## Problem

We converted `Combobox` to an editable typeahead field (the field is the search).
The 12 Combobox-based pickers inherited that for free. The only remaining
searchable-dropdown component that has its own in-popup search input — and would
genuinely benefit from the same treatment — is `MultiSelect`. Today it shows
selected items as chips in the trigger and keeps a separate search `<input>`
inside the dropdown (`multi-select.tsx:169-187`).

## Decision

Convert `MultiSelect` to the standard **tags + typeahead** pattern: an inline
text input sits after the chips in the field; typing there filters; the dropdown
stays a multi-toggle checklist. Public API stays backward-compatible.

## Scope

- **In scope:** `MultiSelect` only.
- **Explicitly NOT changing** (decided during brainstorming): plain `Select` (no
  search), the cmdk `Command`/command palette (intentionally search-first popups),
  `TagsInput` (free-form entry), `DropdownMenu`/`ContextMenu` (no search), and the
  12 Combobox-based pickers (already inherited the new field).
- `MultiSelect` is static-only — there is **no** async/`onSearch` prop today (the
  current doc comment claiming async support is stale and will be corrected).

## Structure change

Replace the split trigger (a `<button>` when empty; a chips `<div>` otherwise)
with one field wrapper (`PopoverAnchor asChild` → `<div>`) that always holds:
selected chips → inline `<input role="combobox">` (the search) → caret toggle.
The dropdown's search-header row (magnifying glass + input + inline "Clear") is
removed.

```
Today:  [ (Alpha ✕) (Beta ✕) +2            ▾ ]   ← chips + caret button
        ┌──────────────────────────────────┐
        │ 🔍 Search…                  Clear │   ← search row (deleted)
        │ ☑ Alpha                           │
        └──────────────────────────────────┘

New:    [ (Alpha ✕) (Beta ✕) type to search… ▾ ]   ← chips + inline input + caret
        ┌──────────────────────────────────┐
        │ ☑ Alpha            (active)        │   ← arrow-highlightable checklist
        │ ☐ Gamma                           │
        ├──────────────────────────────────┤
        │ 2 selected                  Clear │   ← footer: count + bulk clear
        └──────────────────────────────────┘
```

Same Radix foundation as the new Combobox: `PopoverAnchor` for positioning,
`PopoverContent` with `onOpenAutoFocus`/`onCloseAutoFocus` prevented so focus
stays in the inline input, and `onInteractOutside` suppressed for clicks within
our own field (`fieldRef.contains`).

## State machine

Simpler than Combobox — there is no single "selected label" to display, so the
input is always purely a search box.

- `query` = the input's live value (filters label + description, case-insensitive).
- **Open** (focus / click / caret / ArrowDown) → dropdown shows, focus in input.
- **Toggle an option** (click or Enter) → add/remove from `value`, **keep the
  dropdown open**, **clear `query`** so the next term can be typed, reset
  `activeIndex` to first, keep focus in the input.
- **Backspace** on an empty input (`query === ''`) → remove the last selected chip.
- **Close** (Escape / outside-click / Tab / caret) → clear `query`, reset
  `activeIndex`.
- Per-chip ✕ removal stays. Bulk "Clear" moves to the footer beside "N selected".
- `placeholder` shows only when `selected.length === 0` (chips/typing replace it).
- `maxDisplay` chip-collapse (`+N`) behavior unchanged.

## Keyboard (full parity with Combobox)

- ↓ / ↑ — move `activeIndex` over non-disabled options (clamped; opens if closed).
- Home / End — first / last option.
- Enter — toggle the active option; **does not close** (multi-select).
- Backspace (empty input) — remove last chip.
- Escape — close (clear query).
- Tab — close.
- Active option scrolls into view on `activeIndex` change.

### ARIA

- Input: `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`,
  `aria-controls` (listbox id), `aria-activedescendant`
  (`${listboxId}-opt-${index}`, guarded to only reference a rendered option).
- List container: `role="listbox"`, `aria-multiselectable="true"`.
- Options: `role="option"`, `aria-selected` reflecting membership, stable id.

## API / backward compatibility

**No prop changes.** `MultiSelectProps` is unchanged.

- `placeholder` → the inline input's placeholder (shown only with no selection).
- `searchPlaceholder` → kept accepted, **no longer rendered**, marked
  `@deprecated`. The 5 call sites compile unchanged.
- `maxDisplay`, `emptyText`, `disabled`, `id`, `className` → preserved.
- Correct the stale module doc comment (remove the async/`onSearch` claim).

## Testing

### Existing — should still pass

- `multi-select.test.tsx` "uses semantic buttons for selected item removal
  without opening the popover": asserts there is no `Search…` placeholder and that
  the per-chip remove button calls `onChange([])`. Both still hold (the field's
  placeholder comes from `placeholder`, default `Select…`, and is suppressed when
  chips exist; `searchPlaceholder` is no longer rendered). Re-run to confirm; do
  not weaken it.

### New direct coverage — added to `multi-select.test.tsx`

- Typing in the field filters the option list.
- ↓/↑ highlights options; Enter toggles the active option **and the dropdown stays
  open** (listbox still in the document afterward).
- Selecting an option clears the query (the input is empty after a pick).
- Backspace on the empty input removes the last selected chip (`onChange` called
  without that value).
- The footer "Clear" button empties the whole selection (`onChange([])`).
- Focusing/opening shows all options regardless of current chips.

## Blast radius

- 5 call sites use `MultiSelect` (`LocationPolicySettingsSection`,
  `CustomFieldsFormSection`, `defaultFields`, showcase `InputsSection`,
  `calendar-event-form`) — none require changes (API preserved).
- `searchPlaceholder` callers keep compiling (prop still accepted).
