/**
 * Curated data-viz palette — saturated enough for charts, still on semantic tokens.
 * Order avoids adjacent hues clashing in multi-series views.
 */
export const CHART_PALETTE = [
  {
    stroke: 'oklch(var(--cta))',
    fill: 'oklch(var(--cta) / 0.88)',
    soft: 'oklch(var(--cta) / 0.18)',
  },
  { stroke: 'hsl(var(--info))', fill: 'hsl(var(--info) / 0.88)', soft: 'hsl(var(--info) / 0.18)' },
  { stroke: 'hsl(var(--teal))', fill: 'hsl(var(--teal) / 0.88)', soft: 'hsl(var(--teal) / 0.18)' },
  {
    stroke: 'hsl(var(--success))',
    fill: 'hsl(var(--success) / 0.88)',
    soft: 'hsl(var(--success) / 0.18)',
  },
  {
    stroke: 'hsl(var(--warning))',
    fill: 'hsl(var(--warning) / 0.88)',
    soft: 'hsl(var(--warning) / 0.18)',
  },
  {
    stroke: 'hsl(var(--orange))',
    fill: 'hsl(var(--orange) / 0.88)',
    soft: 'hsl(var(--orange) / 0.18)',
  },
  {
    stroke: 'hsl(var(--destructive))',
    fill: 'hsl(var(--destructive) / 0.88)',
    soft: 'hsl(var(--destructive) / 0.18)',
  },
  { stroke: 'hsl(262 52% 58%)', fill: 'hsl(262 52% 58% / 0.88)', soft: 'hsl(262 52% 58% / 0.16)' },
] as const;

/** @deprecated Use CHART_PALETTE[i].stroke — kept for existing imports */
export const CHART_SERIES_COLORS = CHART_PALETTE.map((entry) => entry.stroke);

export const CHART_AXIS = {
  grid: 'hsl(var(--border) / 0.45)',
  tick: 'hsl(var(--muted-foreground) / 0.85)',
  cursor: 'hsl(var(--muted-foreground) / 0.1)',
} as const;

export const CHART_PRIMARY = CHART_PALETTE[0].stroke;

export function getChartPaletteColor(index: number) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

export function resolveChartColor(index: number, override?: string) {
  return override ?? CHART_PALETTE[index % CHART_PALETTE.length].stroke;
}

/** Gauge arc stops — success at high end, warning mid, destructive low */
export const CHART_GAUGE_STOPS = [
  { offset: 0, color: 'hsl(var(--destructive))' },
  { offset: 0.45, color: 'hsl(var(--warning))' },
  { offset: 0.72, color: 'hsl(var(--orange))' },
  { offset: 1, color: 'hsl(var(--success))' },
] as const;

export function gaugeColorForRatio(ratio: number) {
  const clamped = Math.min(1, Math.max(0, ratio));
  if (clamped >= 0.72) return CHART_PALETTE[3].stroke;
  if (clamped >= 0.45) return CHART_PALETTE[4].stroke;
  return CHART_PALETTE[6].stroke;
}
