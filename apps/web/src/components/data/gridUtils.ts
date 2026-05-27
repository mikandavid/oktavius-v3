export type Breakpoint = 'sm' | 'md' | 'lg';

export const BREAKPOINT_MIN_WIDTHS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
};

export function nextSortValue(currentSort: string | undefined, key: string): string {
  if (currentSort === key) return `-${key}`;
  if (currentSort === `-${key}`) return key;
  return key;
}

export function sortValueForColumn(
  currentSort: string | undefined,
  key: string,
): 'asc' | 'desc' | null {
  if (currentSort === key) return 'asc';
  if (currentSort === `-${key}`) return 'desc';
  return null;
}

export function parseCssSizeToPx(
  value: string | number | undefined,
  fallback?: number,
): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  const px = trimmed.match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (px) return Number(px[1]);

  const rem = trimmed.match(/^(-?\d+(?:\.\d+)?)rem$/i);
  if (rem) return Number(rem[1]) * 16;

  return fallback;
}

export function shouldHideForViewport(hideBelow: Breakpoint | undefined, width: number): boolean {
  if (!hideBelow) return false;
  return width < BREAKPOINT_MIN_WIDTHS[hideBelow];
}

export function resolveEffectiveTableWidth(containerWidth: number, viewportWidth: number): number {
  if (containerWidth > 0) return containerWidth;
  return viewportWidth;
}

const DEFAULT_COLUMN_WIDTH_BY_TYPE = {
  text: '10rem',
  status: '7rem',
  date: '8rem',
  currency: '8rem',
  boolean: '4rem',
  badge: '7rem',
} as const;

export function computeMinTableWidth(
  columns: Array<{
    type?: string;
    width?: string | number;
    minWidth?: string | number;
  }>,
  options: { selectable: boolean; hasActions: boolean },
): number {
  const SELECT_WIDTH = 44;
  const ACTIONS_WIDTH = 56;
  let total = 0;

  if (options.selectable) total += SELECT_WIDTH;
  if (options.hasActions) total += ACTIONS_WIDTH;

  for (const column of columns) {
    const type = (column.type ?? 'text') as keyof typeof DEFAULT_COLUMN_WIDTH_BY_TYPE;
    const defaultWidth = parseCssSizeToPx(DEFAULT_COLUMN_WIDTH_BY_TYPE[type] ?? '18rem', 80) ?? 80;
    const width = parseCssSizeToPx(column.width, defaultWidth) ?? defaultWidth;
    const widthMin = parseCssSizeToPx(column.minWidth, 48) ?? 48;
    total += Math.max(widthMin, Math.min(width, defaultWidth));
  }

  return total;
}

export function toggleId(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((currentId) => currentId !== id)
    : [...selectedIds, id];
}

export function toggleAllIds(rowIds: string[], selectedIds: string[]): string[] {
  if (rowIds.length === 0) return selectedIds;

  const allSelected = rowIds.every((id) => selectedIds.includes(id));
  if (allSelected) return selectedIds.filter((id) => !rowIds.includes(id));

  const next = new Set(selectedIds);
  rowIds.forEach((id) => next.add(id));
  return Array.from(next);
}
