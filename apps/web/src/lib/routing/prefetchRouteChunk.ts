/** Minimal shape needed to warm a chunk — an id to memoize on and the loader. */
type PrefetchableModule = {
  id: string;
  loadPage: () => Promise<unknown>;
};

const warmed = new Set<string>();

function prefersReducedData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

/**
 * Warms a module's route chunk by invoking the same dynamic import the lazy
 * route uses, so a subsequent click renders without a download+parse stall.
 *
 * Best-effort: memoized so each chunk is fetched at most once, skipped under
 * Save-Data, and failures are swallowed (they surface normally on real
 * navigation). Safe to call on every hover/focus.
 */
export function prefetchAppNavModule(module: PrefetchableModule): void {
  if (warmed.has(module.id) || prefersReducedData()) return;
  warmed.add(module.id);
  void module.loadPage().catch(() => {
    // Allow a later attempt if this one failed (e.g. transient network).
    warmed.delete(module.id);
  });
}
