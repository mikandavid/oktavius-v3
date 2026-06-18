# Editable Typeahead Combobox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `Combobox` into an editable typeahead field — the field itself is the search input — replacing the button-trigger + in-dropdown-search pattern, while keeping the public API backward-compatible.

**Architecture:** Same Radix Popover foundation. The trigger `<button>` becomes a field wrapper (`PopoverAnchor`) holding an editable `<input>` (`role="combobox"`), a clear (✕) button, and a caret toggle. The in-dropdown search row is removed; the dropdown becomes a `role="listbox"` of `role="option"` buttons with full keyboard navigation. Focus stays in the input (`onOpenAutoFocus` prevented); open/close is driven by input focus/keydown plus Radix's dismiss layer, with `onInteractOutside` suppressed for clicks within our own field.

**Tech Stack:** React 18, TypeScript, `@radix-ui/react-popover`, `@phosphor-icons/react`, Tailwind, Vitest + Testing Library + `userEvent`.

## Global Constraints

- Public `ComboboxProps` shape is unchanged — no call site of `Combobox` (16 importers) may need edits.
- `searchPlaceholder` stays accepted (marked `@deprecated`), ignored at render — 14 files pass it and must keep compiling.
- No native `confirm`/`alert`/`prompt`.
- `PopoverAnchor` is already exported from `packages/base-ui/src/components/popover.tsx` — no popover changes needed.
- Spec: `docs/superpowers/specs/2026-06-18-combobox-editable-field-design.md`.

---

## File Structure

- **Modify (rewrite):** `packages/base-ui/src/components/combobox.tsx` — the component.
- **Create:** `packages/base-ui/src/components/combobox.test.tsx` — direct behavioral coverage.
- **Modify:** `packages/base-ui/src/components/inline-edit.test.tsx:31-52` — the `relation` test interacts with `Combobox` via a button trigger; rewrite for the input field.

Run tests with: `pnpm --filter @oktavius/base-ui exec vitest run src/components/combobox.test.tsx` (single file) or `pnpm --filter @oktavius/base-ui test` (all).

---

## Task 1: Rewrite Combobox as an editable typeahead field

**Files:**

- Modify (full rewrite): `packages/base-ui/src/components/combobox.tsx`
- Test (create): `packages/base-ui/src/components/combobox.test.tsx`

**Interfaces:**

- Consumes: `Popover`, `PopoverAnchor`, `PopoverContent`, `dropdownPopoverPanelClasses` from `./popover`; `limitSelectOptions` from `../lib/limit-select-options`; control-state helpers from `../lib/controlStates`; `Button` from `./button`; `Input` from `./input`; `SelectOptionsOverflowHint` from `./select-options-overflow-hint`.
- Produces: `Combobox` (default single-select) and `ComboboxOption` / `ComboboxProps` types — signatures **unchanged** from today.

This is a coherent rewrite of one tightly-coupled component, so the test suite is written first (all red), then the full implementation (all green), then commit.

- [ ] **Step 1: Write the failing test suite**

Create `packages/base-ui/src/components/combobox.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from './combobox';

const OPTIONS = [
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
];

function renderCombobox(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onChange = vi.fn();
  render(
    <>
      <Combobox options={OPTIONS} onChange={onChange} placeholder="Pick a country" {...props} />
      <button type="button">outside</button>
    </>,
  );
  return { onChange };
}

describe('Combobox (editable typeahead)', () => {
  it('filters options as the user types in the field', async () => {
    const user = userEvent.setup();
    renderCombobox();
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'fra');

    expect(screen.getByRole('option', { name: /france/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /germany/i })).not.toBeInTheDocument();
  });

  it('highlights options with arrow keys and selects on Enter', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    await user.click(screen.getByRole('combobox'));
    // active starts at Germany (index 0); ArrowDown -> France, Enter selects it
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('fr');
  });

  it('shows all options (not filtered to the current value) when focusing a filled field', async () => {
    const user = userEvent.setup();
    renderCombobox({ value: 'de' });
    expect(screen.getByRole('combobox')).toHaveValue('Germany');

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /germany/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /france/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /spain/i })).toBeInTheDocument();
  });

  it('reverts the field text to the selected label on Escape', async () => {
    const user = userEvent.setup();
    renderCombobox({ value: 'de' });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'zzz');
    await user.keyboard('{Escape}');

    expect(field).toHaveValue('Germany');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('reverts the field text when clicking outside without selecting', async () => {
    const user = userEvent.setup();
    renderCombobox({ value: 'de' });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'zzz');
    await user.click(screen.getByText('outside'));

    await waitFor(() => expect(field).toHaveValue('Germany'));
  });

  it('clears the value via the clear button', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({ value: 'de' });
    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('renders async results after debounce', async () => {
    const user = userEvent.setup();
    const asyncItems = vi.fn(async (q: string) => [{ value: 'x', label: `Remote ${q}` }]);
    renderCombobox({ options: [], asyncItems });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'ab');

    await waitFor(() =>
      expect(screen.getByRole('option', { name: /remote ab/i })).toBeInTheDocument(),
    );
  });

  it('prefills the create field with the typed text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => 'new-id');
    renderCombobox({ onCreate: { label: 'Create new', onSubmit } });
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'Acme');
    await user.click(screen.getByRole('button', { name: /create new/i }));

    expect(await screen.findByDisplayValue('Acme')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the suite to verify it fails**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/combobox.test.tsx`
Expected: FAIL — current Combobox has no `role="option"`/`role="listbox"`, the field input does not hold the selected label, and there is no clear button by that name.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `packages/base-ui/src/components/combobox.tsx` with:

```tsx
/**
 * Combobox — editable typeahead single-select.
 *
 * The field itself is the search input: focus it, type to filter, the dropdown
 * below shows matches, selecting fills the field.
 *
 * Modes:
 *   - Static: pass `options`, client-side filter runs as you type
 *   - Async:  pass `asyncItems`, disable client filter, debounce 200ms
 *   - Create: pass `onCreate` to show an inline "add option" field
 *   - Footer: pass `footerAction` for a contextual footer button (e.g. "Manage options")
 *
 * For multi-select use MultiSelect. Do not use Select in app UI — Combobox is the standard single-select.
 */

import { CaretDown, Check, SpinnerGap, X } from '@phosphor-icons/react';
import * as React from 'react';

import {
  controlDisabledClasses,
  controlHoverClasses,
  controlValidationClasses,
  type ControlValidationState,
  filledControlSurfaceClasses,
  resolveControlValidationState,
} from '../lib/controlStates';
import { limitSelectOptions } from '../lib/limit-select-options';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Input } from './input';
import { dropdownPopoverPanelClasses, Popover, PopoverAnchor, PopoverContent } from './popover';
import { SelectOptionsOverflowHint } from './select-options-overflow-hint';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  /** @deprecated The field is now the search input; this prop is ignored. */
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  emptyText?: string;
  className?: string;
  id?: string;
  /** Called on input change for async filtering — skips client-side filter */
  asyncItems?: (query: string) => Promise<ComboboxOption[]>;
  /** Show inline "create new" field at bottom of list */
  onCreate?: {
    label: string;
    placeholder?: string;
    onSubmit: (label: string) => Promise<string | null>;
  };
  /** Footer action button */
  footerAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  isLoading?: boolean;
  validationState?: ControlValidationState;
  valid?: boolean;
  invalid?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder: _searchPlaceholder,
  disabled = false,
  clearable = true,
  emptyText = 'No results.',
  className,
  id,
  asyncItems,
  onCreate,
  footerAction,
  isLoading = false,
  validationState,
  valid,
  invalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [userTyped, setUserTyped] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [remoteOptions, setRemoteOptions] = React.useState<ComboboxOption[]>([]);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createLabel, setCreateLabel] = React.useState('');
  const [isCreatingPending, setIsCreatingPending] = React.useState(false);
  const [isFooterPending, setIsFooterPending] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const createInputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedOption = [...options, ...remoteOptions].find((o) => o.value === value);

  // Filter text is only the typed query — never the resting selected label.
  const query = userTyped ? inputValue : '';

  // ─── Sync the displayed text with the selected option when not typing ──────────
  React.useEffect(() => {
    if (!userTyped) setInputValue(selectedOption?.label ?? '');
  }, [selectedOption?.label, userTyped]);

  // ─── Async fetch ────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!asyncItems || !open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsFetching(true);
      try {
        setRemoteOptions(await asyncItems(query));
      } finally {
        setIsFetching(false);
      }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [asyncItems, open, query]);

  // ─── Reset transient state on close ───────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) {
      setUserTyped(false);
      setIsCreating(false);
      setCreateLabel('');
      setActiveIndex(0);
    }
  }, [open]);

  React.useEffect(() => {
    if (isCreating) setTimeout(() => createInputRef.current?.focus(), 0);
  }, [isCreating]);

  // ─── Derived options ──────────────────────────────────────────────────────────────
  const matchedOptions = React.useMemo(() => {
    if (asyncItems) {
      return query.trim()
        ? remoteOptions
        : [...options, ...remoteOptions.filter((r) => !options.some((o) => o.value === r.value))];
    }
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [asyncItems, options, query, remoteOptions]);

  const { visible: displayOptions, truncated: truncatedOptions } = React.useMemo(
    () => limitSelectOptions(matchedOptions, { selectedValue: value }),
    [matchedOptions, value],
  );

  const hasFooter = Boolean(onCreate || footerAction);

  // ─── Keep activeIndex in range and pointed at an enabled option ─────────────────────
  React.useEffect(() => {
    if (!open) return;
    setActiveIndex((current) => {
      if (current < displayOptions.length && !displayOptions[current]?.disabled) return current;
      const firstEnabled = displayOptions.findIndex((o) => !o.disabled);
      return firstEnabled === -1 ? 0 : firstEnabled;
    });
  }, [open, displayOptions]);

  // ─── Scroll the active option into view ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`${listboxId}-opt-${activeIndex}`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex, listboxId]);

  // ─── Handlers ────────────────────────────────────────────────────────────────────────
  const openField = () => {
    if (disabled) return;
    setOpen(true);
  };

  const handleSelect = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (option.value === value && clearable) {
      onChange?.(null);
    } else {
      onChange?.(option.value);
    }
    setUserTyped(false);
    setOpen(false);
  };

  const moveActive = (delta: number) => {
    if (displayOptions.length === 0) return;
    setActiveIndex((current) => {
      let next = current;
      for (let i = 0; i < displayOptions.length; i += 1) {
        next = (next + delta + displayOptions.length) % displayOptions.length;
        if (!displayOptions[next]?.disabled) return next;
      }
      return current;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openField();
        else moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openField();
        else moveActive(-1);
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          const first = displayOptions.findIndex((o) => !o.disabled);
          if (first !== -1) setActiveIndex(first);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          for (let i = displayOptions.length - 1; i >= 0; i -= 1) {
            if (!displayOptions[i]?.disabled) {
              setActiveIndex(i);
              break;
            }
          }
        }
        break;
      case 'Enter': {
        if (!open) return;
        event.preventDefault();
        if (isLoading || isFetching || isCreating) return;
        const option = displayOptions[activeIndex] ?? displayOptions.find((o) => !o.disabled);
        if (option) handleSelect(option);
        break;
      }
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange?.(null);
    setUserTyped(false);
    setInputValue('');
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!onCreate || isCreatingPending) return;
    const trimmed = createLabel.trim();
    if (!trimmed) return;
    setIsCreatingPending(true);
    try {
      const created = await onCreate.onSubmit(trimmed);
      if (created) {
        onChange?.(created);
        setUserTyped(false);
        setOpen(false);
      }
    } finally {
      setIsCreatingPending(false);
    }
  };

  const handleFooterAction = async () => {
    if (!footerAction || isFooterPending) return;
    setIsFooterPending(true);
    try {
      await footerAction.onClick();
      setOpen(false);
    } finally {
      setIsFooterPending(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────────────
  const resolvedValidation = resolveControlValidationState({ validationState, valid, invalid });
  const showClear = clearable && Boolean(value) && !disabled;

  return (
    <Popover open={open} onOpenChange={(next) => (next ? openField() : setOpen(false))}>
      <PopoverAnchor asChild>
        <div
          ref={fieldRef}
          data-disabled={disabled ? '' : undefined}
          data-valid={resolvedValidation === 'valid' ? 'true' : undefined}
          className={cn(
            'flex h-9 w-full items-center gap-1 px-3 py-1 text-sm',
            filledControlSurfaceClasses,
            controlHoverClasses,
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/40',
            controlDisabledClasses,
            controlValidationClasses(resolvedValidation),
            className,
          )}
        >
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={inputValue}
            placeholder={placeholder}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-activedescendant={open ? `${listboxId}-opt-${activeIndex}` : undefined}
            aria-invalid={resolvedValidation === 'invalid' ? true : undefined}
            onFocus={() => {
              openField();
              setTimeout(() => inputRef.current?.select(), 0);
            }}
            onClick={() => openField()}
            onChange={(e) => {
              setInputValue(e.target.value);
              setUserTyped(true);
              setOpen(true);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              'min-w-0 flex-1 bg-transparent text-sm focus:outline-none',
              'placeholder:text-muted-foreground disabled:cursor-not-allowed',
            )}
          />
          {showClear ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            tabIndex={-1}
            aria-label={open ? 'Close options' : 'Open options'}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (open) {
                setOpen(false);
              } else {
                openField();
                inputRef.current?.focus();
              }
            }}
            className="shrink-0 text-muted-foreground"
          >
            <CaretDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        className={dropdownPopoverPanelClasses}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (fieldRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div
          id={listboxId}
          role="listbox"
          className={cn('overflow-y-auto p-1', hasFooter ? 'max-h-52' : 'max-h-60')}
        >
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-3">
              <SpinnerGap className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : displayOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            <>
              {displayOptions.map((option, index) => (
                <button
                  key={option.value}
                  id={`${listboxId}-opt-${index}`}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left',
                    'transition-colors focus:outline-none',
                    'disabled:pointer-events-none disabled:opacity-50',
                    index === activeIndex && 'bg-muted',
                    option.value === value && 'bg-muted/50',
                  )}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      option.value === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex-1">
                    <span className="block whitespace-nowrap">{option.label}</span>
                    {option.description ? (
                      <span className="block whitespace-nowrap text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
              <SelectOptionsOverflowHint
                truncated={truncatedOptions}
                total={matchedOptions.length}
              />
            </>
          )}
        </div>

        {hasFooter ? (
          <div className="border-t border-border bg-popover p-1.5 space-y-1">
            {onCreate ? (
              isCreating ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    ref={createInputRef}
                    value={createLabel}
                    onChange={(e) => setCreateLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleCreate();
                      }
                      if (e.key === 'Escape') {
                        setIsCreating(false);
                        setCreateLabel('');
                      }
                    }}
                    placeholder={onCreate.placeholder ?? placeholder}
                    disabled={isCreatingPending}
                    className="h-8 flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    disabled={!createLabel.trim() || isCreatingPending}
                    onClick={() => void handleCreate()}
                    aria-label="Confirm create"
                  >
                    {isCreatingPending ? (
                      <SpinnerGap className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    disabled={isCreatingPending}
                    onClick={() => {
                      setIsCreating(false);
                      setCreateLabel('');
                    }}
                    aria-label="Cancel create"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-full justify-start px-2 text-sm font-normal"
                  onClick={() => {
                    setIsCreating(true);
                    setCreateLabel(inputValue.trim());
                  }}
                >
                  {onCreate.label}
                </Button>
              )
            ) : null}
            {footerAction ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-full justify-start px-2 text-sm font-normal"
                disabled={isFooterPending}
                onClick={() => void handleFooterAction()}
              >
                {isFooterPending ? <SpinnerGap className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {footerAction.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/combobox.test.tsx`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Typecheck and lint the package**

Run: `pnpm --filter @oktavius/base-ui typecheck && pnpm --filter @oktavius/base-ui exec eslint src/components/combobox.tsx src/components/combobox.test.tsx`
Expected: no type errors, no lint errors. (The unused `_searchPlaceholder` is intentionally underscore-prefixed to satisfy the no-unused-vars rule while keeping the prop in the public type.)

- [ ] **Step 6: Commit**

```bash
git add packages/base-ui/src/components/combobox.tsx packages/base-ui/src/components/combobox.test.tsx
git commit -m "feat(base-ui): make Combobox an editable typeahead field

The field itself is now the search input with full keyboard navigation,
a clear button, and blur/escape revert. Public API unchanged;
searchPlaceholder kept but deprecated.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Fix the InlineEdit relation test

**Files:**

- Modify: `packages/base-ui/src/components/inline-edit.test.tsx:31-52`

**Interfaces:**

- Consumes: the `Combobox` rendered by `InlineEdit`'s `type="relation"` branch (`inline-edit.tsx:144-157`) — now an editable input (`role="combobox"`) with `role="option"` items, instead of a button trigger.

**Context:** Only the `relation` test uses our `Combobox`. The `type="select"` test (`inline-edit.test.tsx:26`) uses a **native `<select>`** (`inline-edit.tsx:113`) and is unaffected — leave it alone. The relation test currently opens the combobox by clicking a button named after the value; that button no longer exists.

- [ ] **Step 1: Run the relation test to confirm it now fails**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/inline-edit.test.tsx -t "relation"`
Expected: FAIL — `getByRole('button', { name: /apex gmbh/i })` no longer matches the trigger (it is an input now).

- [ ] **Step 2: Rewrite the relation test body**

In `packages/base-ui/src/components/inline-edit.test.tsx`, replace the body of the `it('edits relation values with a searchable picker', ...)` test (lines 31-52) so the interaction matches the editable field:

```tsx
it('edits relation values with a searchable picker', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();

  render(
    <InlineEdit
      value="Apex GmbH"
      type="relation"
      options={[
        { value: 'Apex GmbH', label: 'Apex GmbH', description: 'Client' },
        { value: 'Donau Logistics AG', label: 'Donau Logistics AG', description: 'Client' },
      ]}
      onSave={onSave}
    />,
  );

  const field = screen.getByRole('combobox');
  expect(field).toHaveValue('Apex GmbH');

  await user.click(field);
  await user.click(screen.getByRole('option', { name: /donau logistics ag/i }));

  expect(onSave).toHaveBeenCalledWith('Donau Logistics AG');
});
```

- [ ] **Step 3: Run the relation test to verify it passes**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/inline-edit.test.tsx -t "relation"`
Expected: PASS.

- [ ] **Step 4: Run the full base-ui test suite + typecheck**

Run: `pnpm --filter @oktavius/base-ui test && pnpm --filter @oktavius/base-ui typecheck`
Expected: all tests pass (including the untouched `select` test), no type errors. This confirms the 3 in-package consumers (`address-field`, `phone-input`, `inline-edit`) still work.

- [ ] **Step 5: Commit**

```bash
git add packages/base-ui/src/components/inline-edit.test.tsx
git commit -m "test(base-ui): update InlineEdit relation test for editable Combobox

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Run the whole workspace test + typecheck to catch any app-side regression in the 13 app consumers:

Run: `pnpm -r typecheck && pnpm -r test`
Expected: green. The mocked-Combobox tests (`NotificationSettingsSection.test.tsx`, `TriageControls.test.tsx`) are unaffected; no app call site changed because the public API is identical.

---

## Self-review notes

- **Spec coverage:** structure change → Task 1 Step 3 (PopoverAnchor + input + caret + clear, search row removed). State machine (focus/type/blur/escape/select/clear) → Task 1 tests + handlers. Full keyboard nav + ARIA → `handleKeyDown`, `role=listbox/option`, `aria-activedescendant`, scroll-into-view. API back-compat (`searchPlaceholder` deprecated, `placeholder` as input placeholder, async/onCreate/footer/clearable preserved) → unchanged `ComboboxProps` + footer block. Testing (will-break + new coverage) → Tasks 1 & 2. `MultiSelect` left untouched.
- **Placeholder scan:** none — all steps contain full code/commands.
- **Type consistency:** `ComboboxProps`/`ComboboxOption` unchanged; option element ids use the single `${listboxId}-opt-${index}` form everywhere (`aria-activedescendant`, the option `id`, and scroll-into-view lookup).
- **Correction vs spec:** the spec named `inline-edit.test.tsx:26` as the breaking test; it is actually the **relation** test at lines 31-52 (line 26 is a native `<select>`). Task 2 reflects the corrected target.
