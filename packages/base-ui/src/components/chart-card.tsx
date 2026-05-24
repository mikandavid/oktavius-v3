import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { type ChartPoint, SimpleBarChart, SimpleLineChart } from './chart';
import { SectionCard } from './section-card';

export type ChartCardType = 'line' | 'bar';

export interface ChartCardProps {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  type: ChartCardType;
  data: ChartPoint[];
  height?: number;
  valueFormatter?: (value: number) => string;
  color?: string;
  className?: string;
}

/** KPI chart tile — SectionCard header + SimpleLineChart or SimpleBarChart body. */
export function ChartCard({
  title,
  meta,
  actions,
  type,
  data,
  height = 220,
  valueFormatter,
  color,
  className,
}: ChartCardProps) {
  return (
    <SectionCard title={title} meta={meta} actions={actions} className={className}>
      <div className={cn('-mx-1')}>
        {type === 'line' ? (
          <SimpleLineChart
            data={data}
            height={height}
            valueFormatter={valueFormatter}
            color={color}
            className="border-0 bg-transparent p-0"
          />
        ) : (
          <SimpleBarChart
            data={data}
            height={height}
            valueFormatter={valueFormatter}
            color={color}
            className="border-0 bg-transparent p-0"
          />
        )}
      </div>
    </SectionCard>
  );
}
