import { CheckIcon, SpinnerIcon } from '@/lib/icons';

type AutosaveStatusProps = {
  saving: boolean;
  /** Timestamp of the last successful save, or null if nothing has saved yet. */
  savedAt: number | null;
  savingLabel?: string;
  savedLabel?: string;
  className?: string;
};

/**
 * Compact, passive autosave indicator. Replaces the explicit "Save" button:
 * shows a spinner while a debounced save is in flight, then a brief "Saved"
 * confirmation. Renders nothing before the first save.
 */
export function AutosaveStatus({
  saving,
  savedAt,
  savingLabel = 'Saving…',
  savedLabel = 'Saved',
  className,
}: AutosaveStatusProps) {
  if (saving) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className ?? ''}`}
        aria-live="polite"
      >
        <SpinnerIcon size={14} className="animate-spin" aria-hidden="true" />
        {savingLabel}
      </span>
    );
  }

  if (savedAt) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className ?? ''}`}
        aria-live="polite"
      >
        <CheckIcon size={14} aria-hidden="true" />
        {savedLabel}
      </span>
    );
  }

  return null;
}
