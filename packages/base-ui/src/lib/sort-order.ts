/** Sort items by persisted `sortOrder` (missing values sort last, then by index). */
export function sortBySortOrder<T extends { sortOrder?: number }>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER),
  );
}

/** Assign 1-based `sortOrder` from a drag-reordered id list. */
export function applyOrderedIds<T extends { id: string; sortOrder?: number }>(
  items: readonly T[],
  orderedIds: readonly string[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return orderedIds.flatMap((id, index) => {
    const item = byId.get(id);
    return item ? [{ ...item, sortOrder: index + 1 }] : [];
  });
}

/** Next `sortOrder` for a newly created item appended to the list. */
export function nextSortOrder<T extends { sortOrder?: number }>(items: readonly T[]): number {
  if (!items.length) return 1;
  return Math.max(0, ...items.map((item) => item.sortOrder ?? 0)) + 1;
}
