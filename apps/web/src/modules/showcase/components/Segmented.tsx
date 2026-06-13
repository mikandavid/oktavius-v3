import { cn } from '@oktavius/base-ui';

export type SegmentedOption<T extends string> = { id: T; label: string };

/**
 * A small mutually-exclusive segmented button group used by the showcase
 * settings drawer (density, roundness, card shadow). `value` may be null to
 * indicate no active option (e.g. a custom token edit that matches no preset).
 */
export function Segmented<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: T | null;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-control border border-border p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-[0.4rem] px-3 py-1 text-xs font-medium transition-colors',
            value === option.id
              ? 'bg-sidebar-primary/10 text-sidebar-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
