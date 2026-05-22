export function parseSortKey(sort: string): { key: string; desc: boolean } {
  const desc = sort.startsWith('-');
  return { key: desc ? sort.slice(1) : sort, desc };
}

export function sortRows<T extends Record<string, unknown>>(rows: T[], sort: string): T[] {
  const { key, desc } = parseSortKey(sort);
  return [...rows].sort((a, b) => {
    const left = String(a[key] ?? '');
    const right = String(b[key] ?? '');
    const result = left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
    return desc ? -result : result;
  });
}
