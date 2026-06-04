import { SectionCard, SimplePieChart } from '@oktavius/base-ui';

import type { OctComponentProps } from '../registry';

import { makeValueFormatter, mapChartPoints, parseChartBody } from './chartShared';

export default function OctPieChart({ attrs, body }: OctComponentProps) {
  const config = parseChartBody(body);
  const valueFormatter = makeValueFormatter(config);

  return (
    <SectionCard title={attrs.title} meta={attrs.subtitle}>
      {config.error ? (
        <p className="text-xs text-destructive">{config.error}</p>
      ) : config.data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data.</p>
      ) : (
        <SimplePieChart data={mapChartPoints(config)} valueFormatter={valueFormatter} />
      )}
    </SectionCard>
  );
}
