/**
 * Combobox — searchable single-select dropdown.
 *
 * Modes:
 *   - Static: pass `options`, client-side filter runs automatically
 *   - Async:  pass `asyncItems`, disable client filter, debounce 200ms
 *   - Create: pass `onCreate` to show an inline "add option" field
 *   - Footer: pass `footerAction` for a contextual footer button (e.g. "Manage options")
 *
 * For multi-select use MultiSelect. Do not use Select in app UI — Combobox is the standard single-select.
 */

import { CaretDown, Check, MagnifyingGlass, SpinnerGap, X } from '@phosphor-icons/react';
import * as React from 'react';

import { Button } from './button';
import { Input } from './input';
import { dropdownPopoverPanelClasses, Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  type ControlValidationState,
  controlDisabledClasses,
  controlHoverClasses,
  controlValidationClasses,
  filledControlSurfaceClasses,
  resolveControlValidationState,
} from '../lib/controlStates';
import { SelectOptionsOverflowHint } from './select-options-overflow-hint';
import { limitSelectOptions } from '../lib/limit-select-options';
import { cn } from '../lib/utils';

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
  searchPlaceholder = 'Search…',
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
  const [query, setQuery] = React.useState('');
  const [remoteOptions, setRemoteOptions] = React.useState<ComboboxOption[]>([]);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createLabel, setCreateLabel] = React.useState('');
  const [isCreatingPending, setIsCreatingPending] = React.useState(false);
  const [isFooterPending, setIsFooterPending] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const createInputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── Async fetch ────────────────────────────────────────────────────────────

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

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setIsCreating(false);
      setCreateLabel('');
    }
  }, [open]);

  React.useEffect(() => {
    if (isCreating) setTimeout(() => createInputRef.current?.focus(), 0);
  }, [isCreating]);

  // ─── Derived options ─────────────────────────────────────────────────────────

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
    () =>
      limitSelectOptions(matchedOptions, {
        selectedValue: value,
      }),
    [matchedOptions, value],
  );

  const selectedOption = [...options, ...remoteOptions].find((o) => o.value === value);
  const hasFooter = Boolean(onCreate || footerAction);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleOpen = (nextOpen: boolean) => {
    if (disabled) return;
    setOpen(nextOpen);
    if (nextOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSelect = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (option.value === value && clearable) {
      onChange?.(null);
    } else {
      onChange?.(option.value);
    }
    setOpen(false);
  };

  const selectFirstMatch = () => {
    if (isLoading || isFetching || isCreating) return;
    const first = displayOptions.find((option) => !option.disabled);
    if (first) handleSelect(first);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    selectFirstMatch();
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

  // ─── Render ──────────────────────────────────────────────────────────────────

  const resolvedValidation = resolveControlValidationState({
    validationState,
    valid,
    invalid,
  });

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-invalid={resolvedValidation === 'invalid' ? true : undefined}
          data-valid={resolvedValidation === 'valid' ? 'true' : undefined}
          className={cn(
            'flex h-9 w-full items-center justify-between px-3 py-1 text-sm',
            filledControlSurfaceClasses,
            controlHoverClasses,
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            controlDisabledClasses,
            controlValidationClasses(resolvedValidation),
            !selectedOption && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          <CaretDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent className={dropdownPopoverPanelClasses} align="start">
        <div className="flex items-center border-b border-border px-3 py-2 gap-2">
          <MagnifyingGlass className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className={cn('overflow-y-auto p-1', hasFooter ? 'max-h-52' : 'max-h-60')}>
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-3">
              <SpinnerGap className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : displayOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            <>
              {displayOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left',
                    'transition-colors hover:bg-muted focus:bg-muted focus:outline-none',
                    'disabled:pointer-events-none disabled:opacity-50',
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
                    placeholder={onCreate.placeholder ?? searchPlaceholder}
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
                    setCreateLabel(query.trim());
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
