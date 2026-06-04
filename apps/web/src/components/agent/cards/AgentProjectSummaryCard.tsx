import { Badge, DetailFieldGrid, SectionCard, StatCard } from '@oktavius/base-ui';

import type { AgentProjectSummaryCardPayload } from '../types';

type AgentProjectSummaryCardProps = AgentProjectSummaryCardPayload & {
  className?: string;
} & Record<string, unknown>;

function normalizeMetrics(props: Record<string, unknown>) {
  if (Array.isArray(props.metrics)) {
    return props.metrics as Array<{ label: string; value: string }>;
  }
  const metrics: Array<{ label: string; value: string }> = [];
  for (const [key, value] of Object.entries(props)) {
    if (
      ['kind', 'title', 'subtitle', 'status', 'metrics', 'highlights', 'className'].includes(key)
    ) {
      continue;
    }
    if (typeof value === 'object') continue;
    metrics.push({ label: key, value: String(value ?? '—') });
  }
  return metrics.slice(0, 6);
}

export function AgentProjectSummaryCard(props: AgentProjectSummaryCardProps) {
  const title = (props.title as string) ?? 'Project summary';
  const subtitle = props.subtitle as string | undefined;
  const status = props.status as string | undefined;
  const metrics = props.metrics ?? normalizeMetrics(props);
  const highlights = props.highlights ?? [];

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={subtitle}
      actions={status ? <Badge variant="info">{status}</Badge> : undefined}
    >
      {metrics.length > 0 ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      ) : null}
      {highlights.length > 0 ? (
        <DetailFieldGrid
          fields={highlights.map((highlight, index) => ({
            label: `Highlight ${index + 1}`,
            value: highlight,
          }))}
        />
      ) : null}
    </SectionCard>
  );
}

export default AgentProjectSummaryCard;

export function normalizeProjectSummaryProps(
  props: Record<string, unknown>,
): AgentProjectSummaryCardPayload {
  if (props.kind === 'project-summary') return props as AgentProjectSummaryCardPayload;
  return {
    kind: 'project-summary',
    title: (props.title as string) ?? 'Project summary',
    subtitle: props.subtitle as string | undefined,
    status: props.status as string | undefined,
    metrics: normalizeMetrics(props),
    highlights: Array.isArray(props.highlights) ? (props.highlights as string[]) : undefined,
  };
}
