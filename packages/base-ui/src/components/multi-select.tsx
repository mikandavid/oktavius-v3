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
