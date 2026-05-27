import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import {
  type ChartSeriesDefinition,
  type ComboChartPoint,
  type FunnelChartPoint,
  type MultiSeriesChartPoint,
  type RadarChartPoint,
  type ChartPoint,
  type StackedChartPoint,
  SimpleAreaChart,
  SimpleBarChart,
  SimpleComboChart,
  SimpleFunnelChart,
  SimpleGaugeChart,
  SimpleHorizontalBarChart,
  SimpleLineChart,
  SimpleMultiLineChart,
  SimplePieChart,
  SimpleRadarChart,
  SimpleSparklineChart,
  SimpleStackedBarChart,
} from './chart';
import { SectionCard } from './section-card';

export type ChartCardType =
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'stacked-bar'
  | 'gauge'
  | 'funnel'
  | 'multi-line'
  | 'combo'
  | 'horizontal-bar'
  | 'radar'
  | 'sparkline';

export interface ChartCardProps {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  type: ChartCardType;
  data?: ChartPoint[];
  stackedData?: StackedChartPoint[];
  funnelData?: FunnelChartPoint[];
  multiSeriesData?: MultiSeriesChartPoint[];
  series?: ChartSeriesDefinition[];
  comboData?: ComboChartPoint[];
  radarData?: RadarChartPoint[];
  barLabel?: string;
  lineLabel?: string;
  gaugeValue?: number;
  gaugeMax?: number;
  gaugeLabel?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  color?: string;
  className?: string;
}

/** KPI chart tile — SectionCard header + chart body. */
export function ChartCard({
  title,
  meta,
  actions,
  type,
  data = [],
  stackedData = [],
  funnelData = [],
  multiSeriesData = [],
  series = [],
  comboData = [],
  radarData = [],
  barLabel,
  lineLabel,
  gaugeValue = 0,
  gaugeMax = 100,
  gaugeLabel = 'Progress',
  height = 220,
  valueFormatter,
  color,
  className,
}: ChartCardProps) {
  const chartBody = (() => {
    switch (type) {
      case 'line':
        return (
          <SimpleLineChart
            data={data}
            height={height}
            valueFormatter={valueFormatter}
            color={color}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'bar':
        return (
          <SimpleBarChart
            data={data}
            height={height}
            valueFormatter={valueFormatter}
            color={color}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'area':
        return (
          <SimpleAreaChart
            data={data}
            height={height}
            valueFormatter={valueFormatter}
            color={color}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'pie':
        return (
          <SimplePieChart
            data={data}
            height={height}
            valueFormatter={valueFormatter}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'stacked-bar':
        return (
          <SimpleStackedBarChart
            data={stackedData}
            height={height}
            valueFormatter={valueFormatter}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'gauge':
        return (
          <SimpleGaugeChart
            value={gaugeValue}
            max={gaugeMax}
            label={gaugeLabel}
            height={height}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'funnel':
        return (
          <SimpleFunnelChart
            data={funnelData}
            height={height}
            valueFormatter={valueFormatter}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'multi-line':
        return (
          <SimpleMultiLineChart
            data={multiSeriesData}
            series={series}
            height={height}
            valueFormatter={valueFormatter}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'combo':
        return (
          <SimpleComboChart
            data={comboData}
            barLabel={barLabel}
            lineLabel={lineLabel}
            height={height}
            valueFormatter={valueFormatter}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'horizontal-bar':
        return (
          <SimpleHorizontalBarChart
            data={data}
            height={height}
            valueFormatter={valueFormatter}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'radar':
        return (
          <SimpleRadarChart
            data={radarData}
            series={series}
            height={height}
            className="border-0 bg-transparent p-0"
          />
        );
      case 'sparkline':
        return (
          <SimpleSparklineChart
            data={data}
            height={height ?? 56}
            color={color}
            className="border-0 bg-transparent p-0"
          />
        );
      default:
        return null;
    }
  })();

  return (
    <SectionCard title={title} meta={meta} actions={actions} className={className}>
      <div className={cn('-mx-1')}>{chartBody}</div>
    </SectionCard>
  );
}
