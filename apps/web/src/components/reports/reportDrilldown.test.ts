import { describe, expect, it } from 'vitest';

import { buildReportDrilldown } from './reportDrilldown';
import type { SavedReport } from './reportStorage';

describe('report drill-down helpers', () => {
  it('builds neutral revenue drill-down metadata without sample rows', () => {
    const report: SavedReport = {
      id: 'report_1',
      name: 'Revenue',
      chartType: 'line',
      dataset: 'revenue',
    };

    const drilldown = buildReportDrilldown(report);

    expect(drilldown.title).toBe('Revenue drill-down');
    expect(drilldown.columns).toEqual(['Period', 'Revenue', 'Margin']);
    expect(drilldown.rows).toEqual([]);
    expect(drilldown.emptyStateMessage).toBe('No report data source connected.');
  });

  it('builds neutral order-status drill-down metadata without sample rows', () => {
    const report: SavedReport = {
      id: 'report_2',
      name: 'Orders',
      chartType: 'bar',
      dataset: 'orders',
    };

    const drilldown = buildReportDrilldown(report);

    expect(drilldown.title).toBe('Orders drill-down');
    expect(drilldown.columns).toEqual(['Status', 'Orders']);
    expect(drilldown.rows).toEqual([]);
    expect(drilldown.emptyStateMessage).toBe('No report data source connected.');
  });

  it('builds neutral pipeline drill-down metadata without sample rows', () => {
    const report: SavedReport = {
      id: 'report_3',
      name: 'Pipeline',
      chartType: 'funnel',
      dataset: 'pipeline',
    };

    const drilldown = buildReportDrilldown(report);

    expect(drilldown.title).toBe('Pipeline drill-down');
    expect(drilldown.columns).toEqual(['Stage', 'Count', 'Conversion']);
    expect(drilldown.rows).toEqual([]);
    expect(drilldown.emptyStateMessage).toBe('No report data source connected.');
  });
});
