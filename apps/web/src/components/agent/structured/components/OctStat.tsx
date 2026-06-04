import { StatCard } from '@oktavius/base-ui';

import type { OctComponentProps } from '../registry';

export default function OctStat({ attrs }: OctComponentProps) {
  const trend =
    attrs.trend === 'up' || attrs.trend === 'down' || attrs.trend === 'flat'
      ? attrs.trend === 'flat'
        ? 'neutral'
        : attrs.trend
      : undefined;

  return (
    <StatCard
      label={attrs.label ?? ''}
      value={attrs.value ?? '—'}
      trend={trend}
      delta={attrs.change}
      description={attrs.hint}
    />
  );
}
