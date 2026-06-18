# Combobox → editable typeahead field

**Date:** 2026-06-18
**Component:** `packages/base-ui/src/components/combobox.tsx`
**Status:** Design approved, pending implementation plan

## Problem

Today the `Combobox` trigger is a plain `<button>` showing the selected label + caret.
The search `<input>` lives _inside_ the dropdown (`combobox.tsx:256-270`). The user wants
the field itself to be the search input — the classic editable typeahead/autocomplete
pattern: focus the field, type to filter, the dropdown below shows matches, selecting
fills the field.

## Decision

Replace the behavior **globally** — every `Combobox` becomes an editable typeahead field.
The public API stays backward-compatible so the existing 16 call sites need no changes.

## Scope

- **In scope:** `Combobox` only.
- **Out of scope:** `MultiSelect` (separate component, untouched — revisit later if matching
  behavior is wanted).

## Structure change

The trigger flips from a `<button>` to a field wrapper containing the editable input.
The in-dropdown search row is **deleted** — the field is the search now.

```
Today:  [ Selected label        ▾ ]   ← button
        ┌────────────────────────┐
        │ 🔍 Search…              │   ← input lives here (deleted)
        │ ✓ Option A             │
        └────────────────────────┘

New:    [ type to search…    ✕ ▾ ]   ← input + clear + caret toggle
        ┌────────────────────────┐
        │ ✓ Option A   (active)  │   ← arrow-highlightable
        │   Option B             │
        └────────────────────────┘
```

Still built on the existing Radix Popover. Key changes:

- The input is wrapped in **`PopoverAnchor`** (not `PopoverTrigger`) for positioning;
  open/close is driven manually from input focus/click/keydown.
- `PopoverContent` gets `onOpenAutoFocus={(e) => e.preventDefault()}` so focus **stays in
  the input** while the list shows below. (Without this, Radix Popover steals focus and the
  user can't type — this is the critical gotcha.)
- Export `PopoverAnchor` from `packages/base-ui/src/components/popover.tsx`.
- The caret becomes a clickable toggle; a clear (✕) button sits left of the caret.

## State machine

A single `inputValue` drives the input. A `userTyped` boolean distinguishes "displaying the
selected label" from "actively searching".

- **Closed + value selected** → input shows `selectedOption.label`.
- **Focus / click** → open, **select-all** the text, `userTyped = false` so **all** options
  show (selected one highlighted) rather than filtering down to just the current value.
- **Typing** → `userTyped = true`; filter by `inputValue`; reset `activeIndex` to first match.
- **Select** (click or Enter) → set value, `inputValue = label`, close.
- **Blur / Escape / Tab** → **revert** `inputValue` to the selected option's label, discard
  the query. Free-text never becomes a value (except via `onCreate`).
- **Clear (✕)** → visible when `clearable && value && !disabled`; clears value and query.

## Keyboard (full navigation)

- ↓ / ↑ — move `activeIndex` over non-disabled options (clamped; opens dropdown if closed).
- Home / End — first / last option.
- Enter — select active option, or first match if none active.
- Escape — revert + close.
- Tab — revert + close **without** selecting the highlighted option.
- Active option scrolls into view on `activeIndex` change.

### ARIA

- Input: `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`
  (listbox id), `aria-activedescendant` (active option id).
- List container: `role="listbox"`.
- Options: `role="option"`, stable per-option id, `aria-selected` on the chosen value.

## API / backward compatibility

**No prop changes.** `ComboboxProps` is unchanged.

- `placeholder` → the input's empty-state placeholder.
- `searchPlaceholder` → kept accepted, **no longer rendered**, marked `@deprecated` in the
  type. All 14 files passing it keep compiling; no call-site churn.
- `asyncItems` → unchanged (still debounced 200ms; query is now the field text).
- `onCreate` → unchanged; the create prefill reads the field text instead of the old `query`.
- `footerAction` → unchanged.
- `clearable` → now also gates the visible ✕ button.
- Validation/disabled classes move from the old button to the field wrapper `<div>`; the
  inner input is transparent.

## Testing

### Will break

- `packages/base-ui/src/components/inline-edit.test.tsx:26` uses
  `user.selectOptions(screen.getByRole('combobox'), 'Paid')` — that's the native `<select>`
  API and won't apply to an editable input. Rewrite to: focus field → type "Paid" → Enter
  (or open → click the "Paid" option).

### Safe (mocked Combobox)

- `apps/web/src/components/settings/NotificationSettingsSection.test.tsx`
- `apps/web/src/modules/support/TriageControls.test.tsx`

### New direct coverage — `combobox.test.tsx`

- Typing filters the option list.
- ↓/↑ highlights options; Enter selects the active one.
- Blur reverts the field to the selected label (no orphan text).
- Escape reverts + closes.
- Clear (✕) clears value when `clearable`.
- `asyncItems` still debounces and renders remote results.
- `onCreate` prefills the create field with the typed text.
- Focus-with-value selects-all and shows all options (doesn't filter to the current value).

## Blast radius

- 16 call sites import `Combobox` — none require changes (API preserved).
- 14 files pass `searchPlaceholder` — keep compiling (prop still accepted).
- 1 test (`inline-edit.test.tsx`) requires a rewrite.
