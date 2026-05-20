/**
 * MultiSelect — multi-choice popover with search filter.
 *
 * Selected items display as compact badges inside the trigger.
 * Supports optional search and async options via `onSearch`.
 */

import { Check, MagnifyingGlass, X } from '@phosphor-icons/react';
import * as React from 'react';

import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../lib/utils';

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
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Max badges to show before collapsing to count */
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
  searchPlaceholder = 'Search…',
  disabled = false,
  maxDisplay = 2,
  emptyText = 'No results.',
  className,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = value ?? [];

  const filteredOptions = React.useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const toggle = (optionValue: string) => {
    if (!onChange) return;
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  };

  const removeSelected = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(selected.filter((v) => v !== optionValue));
  };

  const handleOpen = (nextOpen: boolean) => {
    if (disabled) return;
    setOpen(nextOpen);
    if (nextOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const visibleSelected = selected.slice(0, maxDisplay);
  const overflowCount = selected.length - maxDisplay;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'flex min-h-8 w-full flex-wrap items-center gap-1 rounded-control bg-muted/60 px-2 py-1 text-sm hover:bg-muted/80 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              {visibleSelected.map((v) => {
                const opt = options.find((o) => o.value === v);
                return (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="h-5 gap-1 rounded px-1.5 text-[11px] font-normal"
                  >
                    {opt?.label ?? v}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${opt?.label ?? v}`}
                      className="ml-0.5 rounded-full outline-none hover:bg-muted"
                      onClick={(e) => removeSelected(v, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') removeSelected(v, e as never);
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                  </Badge>
                );
              })}
              {overflowCount > 0 ? (
                <Badge variant="outline" className="h-5 rounded px-1.5 text-[11px] font-normal">
                  +{overflowCount}
                </Badge>
              ) : null}
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b border-border px-3 py-2 gap-2">
          <MagnifyingGlass className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange?.([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="max-h-60 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => toggle(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left',
                    'transition-colors hover:bg-muted focus:bg-muted focus:outline-none',
                    'disabled:pointer-events-none disabled:opacity-50',
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
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {selected.length > 0 ? (
          <div className="border-t border-border px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {selected.length} selected
            </span>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
