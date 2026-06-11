export function matchesSearch(query: string, ...values: Array<string | null | undefined>) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

export function limitResults<T>(rows: T[], limit = 6) {
  return rows.slice(0, limit);
}
