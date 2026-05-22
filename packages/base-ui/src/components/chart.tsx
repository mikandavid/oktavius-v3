import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '../lib/utils';

/** Semantic series palette — matches design tokens (cta uses oklch, others hsl). */
export const CHART_SERIES_COLORS = [
  'oklch(var(--cta))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
] as const;

const CHART_COLORS = {
  line: CHART_SERIES_COLORS[0],
  grid: 'hsl(var(--border) / 0.55)',
  axis: 'hsl(var(--muted-foreground))',
  cursor: 'hsl(var(--muted-foreground) / 0.12)',
};

export type ChartPoint = {
  label: string;
  value: number;
  /** Optional per-point color (bar/segment). Falls back to series palette by index. */
  color?: string;
};

export type SimpleChartProps = {
  data: ChartPoint[];
  className?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  /** Line/bar stroke or fill when a single series color is needed */
  color?: string;
};

function resolvePointColor(point: ChartPoint, index: number, fallback?: string) {
  return point.color ?? fallback ?? CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
}

function ChartTooltip({
  active,
  payload,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: ChartPoint; color?: string }>;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const value = payload[0].value ?? 0;
  const swatch = payload[0].color ?? CHART_COLORS.line;
  return (
    <div className="rounded-control border border-border/60 bg-card px-2.5 py-1.5 text-xs shadow-elevated">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: swatch }} />
        <p className="font-medium text-foreground">{point?.label}</p>
      </div>
      <p className="mt-0.5 pl-4 text-muted-foreground">
        {valueFormatter ? valueFormatter(value) : value}
      </p>
    </div>
  );
}

const chartSurfaceClass =
  'w-full min-w-0 rounded-control border border-border/50 bg-muted/25 p-3';

export function SimpleLineChart({
  data,
  className,
  height = 220,
  valueFormatter,
  color = CHART_COLORS.line,
}: SimpleChartProps) {
  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.cursor, strokeWidth: 1 }}
            content={<ChartTooltip valueFormatter={valueFormatter} />}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  className,
  height = 220,
  valueFormatter,
  color,
}: SimpleChartProps) {
  const singleSeriesColor = color;

  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.cursor }}
            content={<ChartTooltip valueFormatter={valueFormatter} />}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((point, index) => (
              <Cell
                key={point.label}
                fill={resolvePointColor(point, index, singleSeriesColor)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
