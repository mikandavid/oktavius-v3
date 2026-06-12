import { SectionCard, StatCard } from '@oktavius/base-ui';

import { MinusIcon, SortAscIcon, SortDescIcon } from '@/lib/icons';

import { formatMetricValue, humanizeKey, metricsFromLooseProps } from '../cardUtils';
import type { AgentFinancialCardPayload } from '../types';

type AgentFinancialCardProps = AgentFinancialCardPayload & {
  className?: string;
} & Record<string, unknown>;

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <SortAscIcon size={14} className="text-success" />;
  if (trend === 'down') return <SortDescIcon size={14} className="text-destructive" />;
  return <MinusIcon size={14} className="text-muted-foreground" />;
}

export function AgentFinancialCard(props: AgentFinancialCardProps) {
  const title = (props.title as string | undefined) ?? 'Financial Summary';
  const metrics =
    props.metrics ??
    metricsFromLooseProps(props).map((metric) => ({
      label: metric.label,
      value: metric.value,
      trend: undefined as 'up' | 'down' | 'flat' | undefined,
    }));

  if (metrics.length <= 3) {
    return (
      <SectionCard className={props.className} title={title} meta={`${metrics.length} metrics`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              trend={
                metric.trend === 'flat'
                  ? 'neutral'
                  : metric.trend === 'up' || metric.trend === 'down'
                    ? metric.trend
                    : undefined
              }
            />
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard className={props.className} title={title} meta={`${metrics.length} metrics`}>
      <div className="divide-y divide-border/60 rounded-md border border-border/60">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="inline-flex items-center gap-1 font-medium tabular-nums">
              <TrendIcon trend={metric.trend} />
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default AgentFinancialCard;

export function normalizeFinancialCardProps(
  props: Record<string, unknown>,
): AgentFinancialCardPayload {
  if (props.kind === 'financial') return props as AgentFinancialCardPayload;
  return {
    kind: 'financial',
    title: props.title as string | undefined,
    metrics: metricsFromLooseProps(props).map((metric) => ({
      label: metric.label,
      value: metric.value,
    })),
  };
}

export function formatLooseCurrencyLabel(key: string, value: unknown): string {
  if (/amount|total|revenue|balance|overdue|debt|cost|price/i.test(key)) {
    return formatMetricValue(value);
  }
  return String(value ?? '—');
}

export function humanizeLooseKey(key: string): string {
  return humanizeKey(key);
}
