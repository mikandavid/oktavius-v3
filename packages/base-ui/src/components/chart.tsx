import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  CHART_AXIS,
  CHART_PRIMARY,
  gaugeColorForRatio,
  getChartPaletteColor,
  resolveChartColor,
} from '../lib/chartPalette';
import { cn } from '../lib/utils';

import {
  ChartEmptyHint,
  ChartGradientDefs,
  ChartLegend,
  chartAreaFill,
  MultiSeriesTooltip,
} from './chart-parts';

export { CHART_SERIES_COLORS } from '../lib/chartPalette';

const CHART_TOOLTIP_OFFSET = { x: 14, y: 14 };
const CHART_TOOLTIP_MOVE_MS = 80;
const CHART_TOOLTIP_FADE_MS = 100;
const CHART_TOOLTIP_TRANSITION = `transform ${CHART_TOOLTIP_MOVE_MS}ms ease-out, opacity ${CHART_TOOLTIP_FADE_MS}ms ease-out`;

const cursorTooltipSurfaceClass =
  'pointer-events-none fixed top-0 left-0 z-[100] rounded-control border border-border/60 bg-card px-2.5 py-1.5 text-xs shadow-elevated';

const rechartsTooltipProps = {
  wrapperStyle: { display: 'none' },
  isAnimationActive: false,
  animationDuration: 0,
} as const;

export type ChartPoint = {
  label: string;
  value: number;
  /** Optional per-point color (bar/segment). Falls back to series palette by index. */
  color?: string;
};

export type StackedChartPoint = ChartPoint & {
  segments: Array<{ key: string; value: number; color?: string }>;
};

export type FunnelChartPoint = {
  label: string;
  value: number;
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

type ChartHoverPoint = {
  point: ChartPoint;
  value: number;
  color: string;
};

type RechartsTooltipPayload = ReadonlyArray<{
  value?: number;
  payload?: ChartPoint;
  color?: string;
}>;

function resolvePointColor(point: ChartPoint, index: number, fallback?: string) {
  return point.color ?? fallback ?? resolveChartColor(index);
}

function ChartTooltipBody({
  hover,
  valueFormatter,
}: {
  hover: ChartHoverPoint;
  valueFormatter?: (value: number) => string;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: hover.color }} />
        <p className="font-medium text-foreground">{hover.point.label}</p>
      </div>
      <p className="mt-0.5 pl-4 text-muted-foreground">
        {valueFormatter ? valueFormatter(hover.value) : hover.value}
      </p>
    </>
  );
}

function hoverEquals(left: ChartHoverPoint | null, right: ChartHoverPoint | null) {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    left.point.label === right.point.label &&
    left.value === right.value &&
    left.color === right.color
  );
}

function RechartsTooltipBridge({
  active,
  payload,
  onHoverChange,
}: {
  active?: boolean;
  payload?: RechartsTooltipPayload;
  onHoverChange: (hover: ChartHoverPoint | null) => void;
}) {
  const entry = payload?.[0];
  const point = entry?.payload;
  const pointLabel = point?.label;
  const value = entry?.value ?? 0;
  const color = entry?.color ?? CHART_PRIMARY;

  useLayoutEffect(() => {
    if (active && point) {
      onHoverChange({ point, value, color });
      return;
    }

    onHoverChange(null);
  }, [active, color, onHoverChange, point, pointLabel, value]);

  return null;
}

function ChartCursorTooltipPortal({
  hover,
  valueFormatter,
  tooltipRef,
}: {
  hover: ChartHoverPoint | null;
  valueFormatter?: (value: number) => string;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={tooltipRef}
      aria-hidden={!hover}
      className={cn(
        cursorTooltipSurfaceClass,
        hover ? 'visible opacity-100' : 'invisible opacity-0',
      )}
      style={{ transition: CHART_TOOLTIP_TRANSITION, willChange: 'transform, opacity' }}
    >
      {hover ? <ChartTooltipBody hover={hover} valueFormatter={valueFormatter} /> : null}
    </div>,
    document.body,
  );
}

function useChartCursorTooltip(valueFormatter?: (value: number) => string) {
  const [hover, setHover] = useState<ChartHoverPoint | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const applyPosition = useCallback((x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x + CHART_TOOLTIP_OFFSET.x}px, ${y + CHART_TOOLTIP_OFFSET.y}px, 0)`;
  }, []);

  const onHoverChange = useCallback((next: ChartHoverPoint | null) => {
    setHover((prev) => (hoverEquals(prev, next) ? prev : next));
  }, []);

  useLayoutEffect(() => {
    if (!hover || !mouseRef.current) return;
    applyPosition(mouseRef.current.x, mouseRef.current.y);
  }, [applyPosition, hover]);

  const surfaceHandlers = {
    onMouseMove: (event: React.MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
      applyPosition(event.clientX, event.clientY);
    },
    onMouseLeave: () => {
      mouseRef.current = null;
      setHover(null);
    },
  };

  const renderTooltipBridge = useCallback(
    (props: { active?: boolean; payload?: unknown }) => (
      <RechartsTooltipBridge
        active={props.active}
        payload={props.payload as RechartsTooltipPayload | undefined}
        onHoverChange={onHoverChange}
      />
    ),
    [onHoverChange],
  );

  const tooltipPortal = (
    <ChartCursorTooltipPortal
      hover={hover}
      valueFormatter={valueFormatter}
      tooltipRef={tooltipRef}
    />
  );

  return { surfaceHandlers, renderTooltipBridge, tooltipPortal };
}

const chartSurfaceClass =
  'w-full min-w-0 rounded-control border border-border/40 bg-gradient-to-b from-muted/20 to-muted/35 p-3';

export function SimpleLineChart({
  data,
  className,
  height = 220,
  valueFormatter,
  color = CHART_PRIMARY,
}: SimpleChartProps) {
  const { surfaceHandlers, renderTooltipBridge, tooltipPortal } =
    useChartCursorTooltip(valueFormatter);

  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }} {...surfaceHandlers}>
      {tooltipPortal}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_AXIS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            {...rechartsTooltipProps}
            cursor={{ stroke: CHART_AXIS.cursor, strokeWidth: 1 }}
            content={renderTooltipBridge}
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
  const { surfaceHandlers, renderTooltipBridge, tooltipPortal } =
    useChartCursorTooltip(valueFormatter);

  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }} {...surfaceHandlers}>
      {tooltipPortal}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_AXIS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            {...rechartsTooltipProps}
            cursor={{ fill: CHART_AXIS.cursor }}
            content={renderTooltipBridge}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((point, index) => (
              <Cell key={point.label} fill={resolvePointColor(point, index, singleSeriesColor)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleAreaChart({
  data,
  className,
  height = 220,
  valueFormatter,
  color = CHART_PRIMARY,
}: SimpleChartProps) {
  const gradientId = useId().replace(/:/g, '');
  const { surfaceHandlers, renderTooltipBridge, tooltipPortal } =
    useChartCursorTooltip(valueFormatter);

  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }} {...surfaceHandlers}>
      {tooltipPortal}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <ChartGradientDefs idPrefix={gradientId} count={1} />
          <CartesianGrid stroke={CHART_AXIS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip {...rechartsTooltipProps} content={renderTooltipBridge} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={chartAreaFill(gradientId, 0)}
            strokeWidth={2.5}
            activeDot={{ r: 5, fill: color, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type SimplePieChartProps = SimpleChartProps & {
  showLegend?: boolean;
};

export function SimplePieChart({
  data,
  className,
  height = 220,
  valueFormatter,
  showLegend = true,
}: SimplePieChartProps) {
  const { surfaceHandlers, renderTooltipBridge, tooltipPortal } =
    useChartCursorTooltip(valueFormatter);

  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }} {...surfaceHandlers}>
      {tooltipPortal}
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip {...rechartsTooltipProps} content={renderTooltipBridge} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="54%"
                outerRadius="80%"
                paddingAngle={3}
                cornerRadius={4}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {data.map((point, index) => (
                  <Cell key={point.label} fill={resolvePointColor(point, index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {showLegend ? (
          <ChartLegend
            className="shrink-0"
            items={data.map((point, index) => ({
              label: point.label,
              color: resolvePointColor(point, index),
            }))}
          />
        ) : null}
      </div>
    </div>
  );
}

export type SimpleStackedBarChartProps = {
  data: StackedChartPoint[];
  className?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
};

export function SimpleStackedBarChart({
  data,
  className,
  height = 220,
  valueFormatter,
}: SimpleStackedBarChartProps) {
  const segmentKeys = Array.from(
    new Set(data.flatMap((point) => point.segments.map((segment) => segment.key))),
  );
  const chartData = data.map((point) => ({
    label: point.label,
    ...Object.fromEntries(point.segments.map((segment) => [segment.key, segment.value])),
  }));
  const { surfaceHandlers, renderTooltipBridge, tooltipPortal } =
    useChartCursorTooltip(valueFormatter);

  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }} {...surfaceHandlers}>
      {tooltipPortal}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_AXIS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            {...rechartsTooltipProps}
            cursor={{ fill: CHART_AXIS.cursor }}
            content={renderTooltipBridge}
          />
          {segmentKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="stack"
              fill={resolveChartColor(index)}
              radius={index === segmentKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type SimpleGaugeChartProps = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  height?: number;
};

export function SimpleGaugeChart({
  value,
  max = 100,
  label = 'Progress',
  className,
  height = 220,
}: SimpleGaugeChartProps) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const percent = Math.round(ratio * 100);
  const arcColor = gaugeColorForRatio(ratio);

  return (
    <div
      className={cn(
        chartSurfaceClass,
        'flex flex-col items-center justify-center gap-3',
        className,
      )}
      style={{ height }}
    >
      <div className="relative h-28 w-28">
        <div
          className="absolute inset-0 rounded-full shadow-[0_0_0_4px_hsl(var(--card))]"
          style={{
            background: `conic-gradient(from 225deg, ${arcColor} 0deg, ${arcColor} ${percent * 2.7}deg, hsl(var(--muted)) ${percent * 2.7}deg, hsl(var(--muted)) 270deg, transparent 270deg)`,
          }}
        />
        <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card text-center">
          <span className="text-lg font-semibold text-foreground">{percent}%</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {value.toLocaleString('de-AT')} / {max.toLocaleString('de-AT')}
      </p>
    </div>
  );
}

export function SimpleFunnelChart({
  data,
  className,
  height = 220,
  valueFormatter,
}: {
  data: FunnelChartPoint[];
  className?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className={cn(chartSurfaceClass, 'space-y-2', className)} style={{ height }}>
      {data.map((point, index) => {
        const widthPercent = Math.max(24, Math.round((point.value / maxValue) * 100));
        return (
          <div key={point.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{point.label}</span>
              <span>{valueFormatter ? valueFormatter(point.value) : point.value}</span>
            </div>
            <div className="h-8 rounded-control bg-muted/30 p-0.5">
              <div
                className="flex h-full items-center rounded-[0.4rem] px-2.5 text-xs font-medium text-card shadow-sm"
                style={{
                  width: `${widthPercent}%`,
                  background: `linear-gradient(90deg, ${point.color ?? getChartPaletteColor(index).fill}, ${point.color ?? getChartPaletteColor(index).stroke})`,
                }}
              >
                {Math.round((point.value / maxValue) * 100)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type ChartSeriesDefinition = {
  key: string;
  label: string;
  color?: string;
};

export type MultiSeriesChartPoint = Record<string, string | number> & {
  label: string;
};

export type SimpleMultiLineChartProps = {
  data: MultiSeriesChartPoint[];
  series: ChartSeriesDefinition[];
  className?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
};

export function SimpleMultiLineChart({
  data,
  series,
  className,
  height = 220,
  valueFormatter,
}: SimpleMultiLineChartProps) {
  if (data.length === 0 || series.length === 0) {
    return (
      <div className={cn(chartSurfaceClass, className)} style={{ height }}>
        <ChartEmptyHint>No series data</ChartEmptyHint>
      </div>
    );
  }

  return (
    <div className={cn(chartSurfaceClass, 'flex min-h-0 flex-col', className)} style={{ height }}>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_AXIS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<MultiSeriesTooltip valueFormatter={valueFormatter} />} />
            {series.map((entry, index) => (
              <Line
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stroke={resolveChartColor(index, entry.color)}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        className="shrink-0"
        items={series.map((entry, index) => ({
          label: entry.label,
          color: resolveChartColor(index, entry.color),
        }))}
      />
    </div>
  );
}

export type ComboChartPoint = {
  label: string;
  barValue: number;
  lineValue: number;
};

export type SimpleComboChartProps = {
  data: ComboChartPoint[];
  barLabel?: string;
  lineLabel?: string;
  className?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
};

export function SimpleComboChart({
  data,
  barLabel = 'Volume',
  lineLabel = 'Trend',
  className,
  height = 220,
  valueFormatter,
}: SimpleComboChartProps) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <div className={cn(chartSurfaceClass, 'flex min-h-0 flex-col', className)} style={{ height }}>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <ChartGradientDefs idPrefix={gradientId} count={1} />
            <CartesianGrid stroke={CHART_AXIS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<MultiSeriesTooltip valueFormatter={valueFormatter} />} />
            <Bar
              dataKey="barValue"
              name={barLabel}
              fill={getChartPaletteColor(1).soft}
              stroke={getChartPaletteColor(1).stroke}
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Line
              type="monotone"
              dataKey="lineValue"
              name={lineLabel}
              stroke={getChartPaletteColor(0).stroke}
              strokeWidth={2.5}
              dot={{ r: 3, fill: getChartPaletteColor(0).stroke, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        className="shrink-0"
        items={[
          { label: barLabel, color: getChartPaletteColor(1).stroke },
          { label: lineLabel, color: getChartPaletteColor(0).stroke },
        ]}
      />
    </div>
  );
}

export function SimpleHorizontalBarChart({
  data,
  className,
  height = 220,
  valueFormatter,
}: SimpleChartProps) {
  const { surfaceHandlers, renderTooltipBridge, tooltipPortal } =
    useChartCursorTooltip(valueFormatter);

  return (
    <div className={cn(chartSurfaceClass, className)} style={{ height }} {...surfaceHandlers}>
      {tooltipPortal}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke={CHART_AXIS.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={72}
            tick={{ fill: CHART_AXIS.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...rechartsTooltipProps}
            cursor={{ fill: CHART_AXIS.cursor }}
            content={renderTooltipBridge}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((point, index) => (
              <Cell key={point.label} fill={resolvePointColor(point, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type RadarChartPoint = Record<string, string | number> & {
  subject: string;
};

export type SimpleRadarChartProps = {
  data: RadarChartPoint[];
  series: ChartSeriesDefinition[];
  className?: string;
  height?: number;
};

export function SimpleRadarChart({ data, series, className, height = 260 }: SimpleRadarChartProps) {
  return (
    <div className={cn(chartSurfaceClass, 'flex min-h-0 flex-col', className)} style={{ height }}>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="52%" outerRadius="72%">
            <PolarGrid stroke={CHART_AXIS.grid} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: CHART_AXIS.tick, fontSize: 11 }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            {series.map((entry, index) => (
              <Radar
                key={entry.key}
                name={entry.label}
                dataKey={entry.key}
                stroke={resolveChartColor(index, entry.color)}
                fill={resolveChartColor(index, entry.color)}
                fillOpacity={0.22}
                strokeWidth={2}
              />
            ))}
            <Tooltip content={<MultiSeriesTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        className="shrink-0"
        items={series.map((entry, index) => ({
          label: entry.label,
          color: resolveChartColor(index, entry.color),
        }))}
      />
    </div>
  );
}

export function SimpleSparklineChart({
  data,
  className,
  height = 48,
  color = CHART_PRIMARY,
}: SimpleChartProps) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <div className={cn('w-full min-w-0', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`${gradientId}-sparkline`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#${gradientId}-sparkline)`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
