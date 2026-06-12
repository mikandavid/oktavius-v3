import type { ReactNode } from 'react';

import { CHART_PALETTE, resolveChartColor } from '../lib/chartPalette';
import { cn } from '../lib/utils';

export type ChartLegendItem = {
  label: string;
  color?: string;
};

type ChartLegendProps = {
  items: ChartLegendItem[];
  className?: string;
};

/** Compact color key for multi-series and pie charts. */
export function ChartLegend({ items, className }: ChartLegendProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('flex min-w-0 flex-wrap gap-x-4 gap-y-1.5 overflow-hidden pt-2', className)}>
      {items.map((item, index) => (
        <div
          key={item.label}
          className="flex min-w-0 max-w-full items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: resolveChartColor(index, item.color) }}
          />
          <span className="truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

type ChartGradientDefsProps = {
  idPrefix: string;
  count?: number;
};

/** SVG linear gradients for area / combo fills — mount once per chart surface. */
export function ChartGradientDefs({
  idPrefix,
  count = CHART_PALETTE.length,
}: ChartGradientDefsProps) {
  return (
    <defs>
      {CHART_PALETTE.slice(0, count).map((entry, index) => (
        <linearGradient key={index} id={`${idPrefix}-area-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={entry.stroke} stopOpacity={0.38} />
          <stop offset="55%" stopColor={entry.stroke} stopOpacity={0.12} />
          <stop offset="100%" stopColor={entry.stroke} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </defs>
  );
}

export function chartAreaFill(idPrefix: string, seriesIndex: number) {
  return `url(#${idPrefix}-area-${seriesIndex % CHART_PALETTE.length})`;
}

export function MultiSeriesTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-control border border-border/60 bg-card px-2.5 py-1.5 text-xs shadow-elevated">
      {label ? <p className="mb-1 font-medium text-foreground">{label}</p> : null}
      <div className="space-y-0.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? CHART_PALETTE[0].stroke }}
              />
              {entry.name}
            </span>
            <span className="font-medium text-foreground">
              {valueFormatter && entry.value !== undefined
                ? valueFormatter(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartEmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
