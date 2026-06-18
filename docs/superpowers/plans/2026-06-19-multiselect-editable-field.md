# Editable Typeahead MultiSelect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `MultiSelect` into an inline chips + typeahead field — the field holds the selected chips and an inline search input — mirroring the editable `Combobox`, while keeping the public API backward-compatible.

**Architecture:** Same Radix Popover foundation as the new Combobox. The split trigger (button when empty / chips div otherwise) becomes one `PopoverAnchor` field wrapper holding chips → inline `<input role="combobox">` → caret toggle. The in-dropdown search row is removed; the dropdown stays a multi-toggle `role="listbox"` checklist with full keyboard navigation. Focus stays in the input (`onOpenAutoFocus` prevented); `onInteractOutside` is suppressed for clicks within the field.

**Tech Stack:** React 18, TypeScript, `@radix-ui/react-popover`, `@phosphor-icons/react`, Tailwind, Vitest + Testing Library + `userEvent`.

## Global Constraints

- Public `MultiSelectProps` shape is unchanged — no call site of `MultiSelect` (5 importers) may need edits.
- `searchPlaceholder` stays accepted (marked `@deprecated`), ignored at render.
- `MultiSelect` is static-only — do NOT add async/`onSearch`. Correct the stale module doc comment that claims async support.
- No native `confirm`/`alert`/`prompt`.
- `PopoverAnchor` is already exported from `packages/base-ui/src/components/popover.tsx` — do NOT modify popover.tsx.
- Selecting an option must NOT close the dropdown (multi-select stays open for further toggles).
- Spec: `docs/superpowers/specs/2026-06-19-multiselect-editable-field-design.md`.

---

## File Structure

- **Modify (rewrite):** `packages/base-ui/src/components/multi-select.tsx` — the component.
- **Modify (extend):** `packages/base-ui/src/components/multi-select.test.tsx` — keep the existing removal test, add typeahead coverage.

Run tests with: `pnpm --filter @oktavius/base-ui exec vitest run src/components/multi-select.test.tsx` (single file) or `pnpm --filter @oktavius/base-ui test` (all).

---

## Task 1: Rewrite MultiSelect as an inline chips + typeahead field

**Files:**

- Modify (full rewrite): `packages/base-ui/src/components/multi-select.tsx`
- Modify (replace contents, preserving the existing test): `packages/base-ui/src/components/multi-select.test.tsx`

**Interfaces:**

- Consumes: `Popover`, `PopoverAnchor`, `PopoverContent`, `dropdownPopoverPanelClasses` from `./popover`; `limitSelectOptions` from `../lib/limit-select-options`; `Badge` from `./badge`; `SelectOptionsOverflowHint` from `./select-options-overflow-hint`.
- Produces: `MultiSelect`, `MultiSelectOption`, `MultiSelectProps` — signatures **unchanged** from today.

This is a coherent rewrite of one tightly-coupled component, so the test suite is written first (new tests red), then the full implementation (all green), then commit.

- [ ] **Step 1: Write the failing test suite**

Replace the entire contents of `packages/base-ui/src/components/multi-select.test.tsx` with the following (this PRESERVES the existing removal test and adds typeahead coverage):

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiSelect } from './multi-select';

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma' },
];

describe('MultiSelect', () => {
  it('uses semantic buttons for selected item removal without opening the popover', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MultiSelect options={options} value={['alpha']} onChange={onChange} />);

    const removeButton = screen.getByRole('button', { name: 'Remove Alpha' });

    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();

    await user.click(removeButton);

    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('filters options as the user types in the field', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={[]} onChange={vi.fn()} />);
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'gam');

    expect(screen.getByRole('option', { name: /gamma/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /alpha/i })).not.toBeInTheDocument();
  });

  it('toggles the active option with arrow keys + Enter and keeps the dropdown open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    // active starts at Alpha (index 0); ArrowDown -> Beta, Enter toggles it
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith(['beta']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('clears the query after selecting an option', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={[]} onChange={vi.fn()} />);
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.type(field, 'al');
    expect(field).toHaveValue('al');

    await user.click(screen.getByRole('option', { name: /alpha/i }));
    expect(field).toHaveValue('');
  });

  it('removes the last chip on Backspace when the input is empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} value={['alpha', 'beta']} onChange={onChange} />);
    const field = screen.getByRole('combobox');
    await user.click(field);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(['alpha']);
  });

  it('clears all selections via the footer Clear button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} value={['alpha', 'beta']} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows all options when opened regardless of current selection', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={['alpha']} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: /alpha/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /beta/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /gamma/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the suite to verify it fails**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/multi-select.test.tsx`
Expected: the existing removal test passes; the 6 new tests FAIL — current MultiSelect has no `role="combobox"` input in the field, no `role="option"` items, no footer Clear button, no Backspace-removes-chip, no query-clear-on-select.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `packages/base-ui/src/components/multi-select.tsx` with:

```tsx
/**
 * MultiSelect — inline chips + typeahead field.
 *
 * Selected items render as chips inside the field; an inline input beside them
 * is the search. Typing filters; the dropdown stays open as a checklist you
 * toggle. Static options only — no async.
 */

import { CaretDown, Check, X } from '@phosphor-icons/react';
import * as React from 'react';

import { limitSelectOptions } from '../lib/limit-select-options';
import { cn } from '../lib/utils';
import { Badge } from './badge';
import { dropdownPopoverPanelClasses, Popover, PopoverAnchor, PopoverContent } from './popover';
import { SelectOptionsOverflowHint } from './select-options-overflow-hint';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  /** @deprecated The field is now the search input; this prop is ignored. */
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Max chips to show before collapsing to count */
  maxDisplay?: number;
  emptyText?: string;
  className?: string;
  id?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder: _searchPlaceholder,
  disabled = false,
  maxDisplay = 2,
  emptyText = 'No results.',
  className,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  const selected = React.useMemo(() => value ?? [], [value]);

  const matchedOptions = React.useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const { visible: filteredOptions, truncated: truncatedOptions } = React.useMemo(
    () => limitSelectOptions(matchedOptions, { selectedValues: selected }),
    [matchedOptions, selected],
  );

  // ─── Reset transient state on close ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  // ─── Keep activeIndex in range and pointed at an enabled option ──────────────────
  React.useEffect(() => {
    if (!open) return;
    setActiveIndex((current) => {
      if (current < filteredOptions.length && !filteredOptions[current]?.disabled) return current;
      const firstEnabled = filteredOptions.findIndex((o) => !o.disabled);
      return firstEnabled === -1 ? 0 : firstEnabled;
    });
  }, [open, filteredOptions]);

  // ─── Scroll the active option into view ──────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`${listboxId}-opt-${activeIndex}`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex, listboxId]);

  // ─── Handlers ────────────────────────────────────────────────────────────────────
  const openField = () => {
    if (disabled) return;
    setOpen(true);
  };

  const toggle = (optionValue: string) => {
    if (!onChange) return;
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const removeSelected = (optionValue: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange?.(selected.filter((v) => v !== optionValue));
  };

  const moveActive = (delta: number) => {
    if (filteredOptions.length === 0) return;
    setActiveIndex((current) => {
      let next = current;
      for (let i = 0; i < filteredOptions.length; i += 1) {
        next = (next + delta + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[next]?.disabled) return next;
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
          const first = filteredOptions.findIndex((o) => !o.disabled);
          if (first !== -1) setActiveIndex(first);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          for (let i = filteredOptions.length - 1; i >= 0; i -= 1) {
            if (!filteredOptions[i]?.disabled) {
              setActiveIndex(i);
              break;
            }
          }
        }
        break;
      case 'Enter': {
        if (!open) return;
        event.preventDefault();
        const option = filteredOptions[activeIndex] ?? filteredOptions.find((o) => !o.disabled);
        if (option && !option.disabled) toggle(option.value);
        break;
      }
      case 'Backspace':
        if (query === '' && selected.length > 0) {
          event.preventDefault();
          onChange?.(selected.slice(0, -1));
        }
        break;
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

  const visibleSelected = selected.slice(0, maxDisplay);
  const overflowCount = selected.length - maxDisplay;

  return (
    <Popover open={open} onOpenChange={(next) => (next ? openField() : setOpen(false))}>
      <PopoverAnchor asChild>
        <div
          ref={fieldRef}
          data-disabled={disabled ? '' : undefined}
          className={cn(
            'flex min-h-8 w-full flex-wrap items-center gap-1 rounded-control bg-muted/60 px-2 py-1 text-sm transition-colors',
            'focus-within:ring-2 focus-within:ring-ring/40',
            disabled && 'cursor-not-allowed opacity-50',
            className,
          )}
        >
          {visibleSelected.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Badge
                key={v}
                variant="secondary"
                className="h-5 gap-1 rounded px-1.5 text-[11px] font-normal"
              >
                {opt?.label ?? v}
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${opt?.label ?? v}`}
                  className="ml-0.5 rounded-full outline-none hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => removeSelected(v, e)}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
          {overflowCount > 0 ? (
            <Badge variant="outline" className="h-5 rounded px-1.5 text-[11px] font-normal">
              +{overflowCount}
            </Badge>
          ) : null}
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={query}
            placeholder={selected.length === 0 ? placeholder : undefined}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-activedescendant={
              open && filteredOptions.length > 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
            onFocus={() => openField()}
            onClick={() => openField()}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              'h-5 min-w-[3rem] flex-1 bg-transparent text-sm focus:outline-none',
              'placeholder:text-muted-foreground disabled:cursor-not-allowed',
            )}
          />
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
            className="ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-control text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
          >
            <CaretDown className="h-3 w-3" aria-hidden />
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
          aria-multiselectable="true"
          className="max-h-60 overflow-y-auto p-1"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            <>
              {filteredOptions.map((option, index) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    id={`${listboxId}-opt-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => toggle(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left',
                      'transition-colors focus:outline-none',
                      'disabled:pointer-events-none disabled:opacity-50',
                      index === activeIndex && 'bg-muted',
                      isSelected && 'bg-muted/50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-border/60',
                        isSelected && 'border-foreground bg-foreground text-background',
                      )}
                    >
                      {isSelected ? <Check className="h-2.5 w-2.5" weight="bold" /> : null}
                    </div>
                    <span className="flex-1">
                      <span className="block whitespace-nowrap">{option.label}</span>
                      {option.description ? (
                        <span className="block whitespace-nowrap text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
              <SelectOptionsOverflowHint
                truncated={truncatedOptions}
                total={matchedOptions.length}
              />
            </>
          )}
        </div>

        {selected.length > 0 ? (
          <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
            <span className="text-xs text-muted-foreground">{selected.length} selected</span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange?.([])}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/multi-select.test.tsx`
Expected: PASS — all 7 tests green (the preserved removal test + 6 new).

- [ ] **Step 5: Typecheck and lint the package**

Run: `pnpm --filter @oktavius/base-ui typecheck && pnpm --filter @oktavius/base-ui exec eslint src/components/multi-select.tsx src/components/multi-select.test.tsx`
Expected: no type errors, no lint errors. (`_searchPlaceholder` is underscore-prefixed to satisfy no-unused-vars while keeping the prop in the public type.)

- [ ] **Step 6: Commit**

```bash
git add packages/base-ui/src/components/multi-select.tsx packages/base-ui/src/components/multi-select.test.tsx
git commit -m "feat(base-ui): make MultiSelect an inline chips + typeahead field

Search moves into the field beside the chips, with full keyboard
navigation, Backspace-removes-chip, and a footer Clear. Dropdown stays
open on toggle. Public API unchanged; searchPlaceholder kept but deprecated.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Run the whole base-ui suite + a workspace typecheck to confirm no regression in the 5 app consumers:

Run: `pnpm --filter @oktavius/base-ui test && pnpm -r typecheck`
Expected: base-ui suite green. The two PRE-EXISTING, unrelated `apps/web` typecheck errors (`agentIntegrationsClient.test.ts:25`, `schedulerClient.test.ts:31` — strict-null on a fetch mock) may still appear; they are not caused by this change (this diff only touches `packages/base-ui`). No NEW type errors should appear. No `MultiSelect` call site changed because the public API is identical.

---

## Self-review notes

- **Spec coverage:** structure change (chips + inline input + caret, search row removed) → Task 1 Step 3. State machine (open/toggle-keeps-open/clear-query-on-select/backspace-removes-chip/close-clears-query) → handlers + tests. Full keyboard nav + ARIA (`role=combobox/listbox/option`, `aria-multiselectable`, `aria-activedescendant` guarded) → `handleKeyDown` + render. API back-compat (`searchPlaceholder` deprecated, `placeholder` as input placeholder shown only when empty, `maxDisplay`/`emptyText` preserved) → unchanged `MultiSelectProps`. Stale doc comment corrected → new module comment says "Static options only — no async". Footer Clear relocated → footer block. Existing test preserved → kept verbatim in Step 1.
- **Placeholder scan:** none — all steps contain full code/commands.
- **Type consistency:** `MultiSelectProps`/`MultiSelectOption` unchanged; option element ids use the single `${listboxId}-opt-${index}` form in `aria-activedescendant`, the option `id`, and the scroll-into-view lookup.
- **YAGNI:** no async added (matches spec — MultiSelect is static-only).
