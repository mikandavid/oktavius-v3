import type { ChartPoint } from '@oktavius/base-ui';

export interface ChartConfig {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  yLabel?: string;
  yFormat?: 'currency' | 'number' | 'percent';
  currency?: string;
  error?: string;
}

export function parseChartBody(body: string): ChartConfig {
  const trimmed = body.trim();
  if (!trimmed) {
    return { data: [], xKey: 'name', yKey: 'value', error: 'Missing chart data' };
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      data?: unknown;
      xKey?: unknown;
      yKey?: unknown;
      yLabel?: unknown;
      yFormat?: unknown;
      currency?: unknown;
    };

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.data)) {
      return { data: [], xKey: 'name', yKey: 'value', error: 'Body must be { "data": [...] }' };
    }

    const data = parsed.data.filter(
      (row): row is Record<string, unknown> => !!row && typeof row === 'object',
    );

    return {
      data,
      xKey: typeof parsed.xKey === 'string' ? parsed.xKey : 'name',
      yKey: typeof parsed.yKey === 'string' ? parsed.yKey : 'value',
      yLabel: typeof parsed.yLabel === 'string' ? parsed.yLabel : undefined,
      yFormat:
        parsed.yFormat === 'currency' || parsed.yFormat === 'number' || parsed.yFormat === 'percent'
          ? parsed.yFormat
          : undefined,
      currency: typeof parsed.currency === 'string' ? parsed.currency : undefined,
    };
  } catch {
    return { data: [], xKey: 'name', yKey: 'value', error: 'Could not parse JSON body' };
  }
}

export function makeValueFormatter(config: ChartConfig): (value: number) => string {
  if (config.yFormat === 'currency') {
    const currency = config.currency || 'EUR';
    return (value) =>
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value);
  }
  if (config.yFormat === 'percent') {
    return (value) => `${value.toFixed(1)}%`;
  }
  return (value) => {
    if (!Number.isFinite(value)) return String(value);
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
    }
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  };
}

export function mapChartPoints(config: ChartConfig): ChartPoint[] {
  return config.data.map((row) => ({
    label: String(row[config.xKey] ?? ''),
    value: Number(row[config.yKey] ?? 0),
  }));
}
