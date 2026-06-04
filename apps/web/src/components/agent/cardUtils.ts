const HIDDEN_METRIC_KEYS = new Set([
  'id',
  'orgId',
  'org_id',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
  'period',
  'kind',
  'className',
  'title',
  'metrics',
  'items',
  'tasks',
  'events',
  'results',
  'groups',
]);

export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatMetricValue(value: unknown): string {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value);
  }
  return String(value ?? '—');
}

export function metricsFromLooseProps(
  props: Record<string, unknown>,
): Array<{ label: string; value: string; numValue?: number }> {
  const metrics: Array<{ label: string; value: string; numValue?: number }> = [];
  for (const [key, val] of Object.entries(props)) {
    if (HIDDEN_METRIC_KEYS.has(key)) continue;
    if (typeof val === 'object' && val !== null) continue;
    if (val === null || val === undefined) continue;
    metrics.push({
      label: humanizeKey(key),
      value: formatMetricValue(val),
      numValue: typeof val === 'number' ? val : undefined,
    });
  }
  return metrics;
}

export function readLabel(item: Record<string, unknown>): string {
  return String(
    item.title ?? item.name ?? item.label ?? item.displayName ?? item.description ?? 'Item',
  );
}
