import * as React from 'react';

import { cn } from '../lib/utils';
import { Input } from './input';

export interface InlineEditProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'number' | 'email';
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
  placeholder = 'Click to edit…',
  disabled = false,
  type = 'text',
  className,
}: InlineEditProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 0);
  }, [editing]);

  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  const commit = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <span
        role={disabled ? undefined : 'button'}
        tabIndex={disabled ? undefined : 0}
        onClick={disabled ? undefined : () => setEditing(true)}
        onKeyDown={disabled ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') setEditing(true); }}
        className={cn(
          'rounded px-1 -mx-1 py-0.5 text-sm transition-colors',
          !disabled && 'cursor-text hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !value && 'text-muted-foreground',
          disabled && 'cursor-default',
        )}
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Input
        ref={inputRef}
        type={type}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); void commit(); }
          if (e.key === 'Escape') { setEditing(false); }
        }}
        className="h-7"
      />
    </div>
  );
}
