import type { KeyboardEvent, ReactNode } from 'react';

import { buttonFocusClasses } from '../lib/controlStates';
import { cn } from '../lib/utils';

export interface SegmentedToggleOption<T extends string> {
  value: T;
  /** Visible label (may be an abbreviation like "DE"). */
  label: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Accessible name when the visible label is an abbreviation/icon. */
  ariaLabel?: string;
}

export interface SegmentedToggleProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedToggleOption<T>>;
  onChange: (value: T) => void;
  /** Labels the whole control for assistive tech. */
  ariaLabel: string;
  className?: string;
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedToggleProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (direction === 0) {
      return;
    }
    event.preventDefault();
    const next = (index + direction + options.length) % options.length;
    const nextOption = options[next];
    if (nextOption) {
      onChange(nextOption.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5', className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel ?? option.label}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'flex h-6 min-w-[1.75rem] items-center justify-center gap-1 rounded-[5px] px-2 text-xs font-medium transition-colors',
              buttonFocusClasses,
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
