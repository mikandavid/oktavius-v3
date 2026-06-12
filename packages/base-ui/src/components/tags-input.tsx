/**
 * TagsInput — free-form chip entry.
 *
 * Enter or comma adds a tag. Backspace on empty input removes the last tag.
 * Duplicate tags are silently ignored.
 * Value is string[].
 */

import { X } from '@phosphor-icons/react';
import * as React from 'react';

import { cn } from '../lib/utils';
import { Badge } from './badge';

export interface TagsInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Max tag length, default 64 */
  maxTagLength?: number;
  className?: string;
  id?: string;
}

export function TagsInput({
  value,
  onChange,
  placeholder = 'Add tag…',
  disabled = false,
  maxTagLength = 64,
  className,
  id,
}: TagsInputProps) {
  const [input, setInput] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const tags = value ?? [];

  const addTag = (raw: string) => {
    const trimmed = raw.trim().slice(0, maxTagLength);
    if (trimmed && !tags.includes(trimmed)) {
      onChange?.([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange?.(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      if (lastTag !== undefined) removeTag(lastTag);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click only delegates focus to the inner input, which keyboard users reach by tabbing
    <div
      className={cn(
        'flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-control bg-muted/60 px-2 py-1 text-sm',
        'transition-colors hover:bg-muted/80 focus-within:ring-2 focus-within:ring-ring/40',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="h-5 gap-1 rounded px-1.5 text-[11px] font-normal"
        >
          {tag}
          {!disabled ? (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 rounded-full outline-none hover:bg-muted"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          ) : null}
        </Badge>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addTag(input);
        }}
        placeholder={tags.length === 0 ? placeholder : undefined}
        disabled={disabled}
        className="h-6 min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
