import { useEffect, useRef } from 'react';

export type UseDebouncedAutosaveOptions<T> = {
  /** Persist callback. Receives the latest value once the debounce settles. */
  onSave: (value: T) => void | Promise<void>;
  /**
   * Gate. Keep this `false` until the value reflects a user edit so the initial
   * (and async-loaded) value never triggers a write-back. Flip it `true` from
   * your change handler.
   */
  enabled?: boolean;
  delayMs?: number;
};

/**
 * Fires `onSave(value)` once `value` has been stable for `delayMs`, but only
 * while `enabled`. Each change reschedules; unmount/disable cancels the pending
 * save. `onSave` must not feed its result back into `value`, or saves will loop.
 */
export function useDebouncedAutosave<T>(value: T, options: UseDebouncedAutosaveOptions<T>): void {
  const { onSave, enabled = true, delayMs = 1000 } = options;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setTimeout(() => {
      void onSaveRef.current(value);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [value, enabled, delayMs]);
}
