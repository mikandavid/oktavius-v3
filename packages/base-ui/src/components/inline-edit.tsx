import * as React from 'react';

import { cn } from '../lib/utils';
import {
  sanitizeDecimalInput,
  sanitizeEmailInput,
  sanitizeIntegerInput,
} from '../lib/input-sanitize';
import { Combobox, type ComboboxOption } from './combobox';
import { Input } from './input';

export type InlineEditOption = ComboboxOption;

export interface InlineEditProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  displayValue?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'number' | 'decimal' | 'email' | 'select' | 'relation' | 'date' | 'datetime';
  options?: InlineEditOption[];
  className?: string;
}

/**
 * Click-to-edit field for detail views.
 * Shows as a styled span at rest; becomes an input on click.
 * Saves on Enter or blur; cancels on Escape.
 */
export function InlineEdit({
  value,
  onSave,
  displayValue,
  placeholder = 'Click to edit…',
  disabled = false,
  type = 'text',
  options = [],
  className,
}: InlineEditProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectRef = React.useRef<HTMLSelectElement>(null);

  React.useEffect(() => {
    if (!editing) return;
    setTimeout(() => {
      if (type === 'select') selectRef.current?.focus();
      else inputRef.current?.focus();
    }, 0);
  }, [editing, type]);

  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  const sanitizeDraft = React.useCallback(
    (next: string) => {
      if (type === 'email') return sanitizeEmailInput(next);
      if (type === 'number') return sanitizeIntegerInput(next);
      if (type === 'decimal') return sanitizeDecimalInput(next);
      return next;
    },
    [type],
  );

  const commit = async (nextValue = draft) => {
    if (nextValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(nextValue);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const restValue = value ? (displayValue ?? value) : placeholder;

  if (!editing) {
    return (
      <span
        role={disabled ? undefined : 'button'}
        tabIndex={disabled ? undefined : 0}
        onClick={disabled ? undefined : () => setEditing(true)}
        onKeyDown={
          disabled
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') setEditing(true);
              }
        }
        className={cn(
          'rounded px-1 -mx-1 py-0.5 text-sm transition-colors',
          !disabled &&
            'cursor-text hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !value && 'text-muted-foreground',
          disabled && 'cursor-default',
        )}
      >
        {restValue}
      </span>
    );
  }

  if (type === 'select') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <select
          ref={selectRef}
          value={draft}
          disabled={saving}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraft(nextValue);
            void commit(nextValue);
          }}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setEditing(false);
          }}
          className="h-7 rounded-control border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'relation') {
    const relationOptions =
      value && !options.some((option) => option.value === value)
        ? [{ value, label: value }, ...options]
        : options;

    return (
      <div className={cn('min-w-56', className)}>
        <Combobox
          value={draft || undefined}
          options={relationOptions}
          placeholder={placeholder}
          disabled={saving}
          onChange={(nextValue) => {
            const resolvedValue = nextValue ?? '';
            setDraft(resolvedValue);
            void commit(resolvedValue);
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Input
        ref={inputRef}
        type={
          type === 'number' || type === 'decimal'
            ? 'text'
            : type === 'datetime'
              ? 'datetime-local'
              : type
        }
        inputMode={type === 'number' ? 'numeric' : type === 'decimal' ? 'decimal' : undefined}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(sanitizeDraft(e.target.value))}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          }
          if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        className="h-7"
      />
    </div>
  );
}
