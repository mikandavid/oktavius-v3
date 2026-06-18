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
                    setCreateLabel(inputValue.trim());
                    setUserTyped(false);
                    setIsCreating(true);
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
