import { describe, expect, it } from 'vitest';

import { buildReportDrilldown } from './reportDrilldown';
import type { SavedReport } from './reportStorage';

describe('report drill-down helpers', () => {
  it('builds revenue drill-down rows with currency formatted values', () => {
    const report: SavedReport = {
      id: 'report_1',
      name: 'Revenue',
      chartType: 'line',
      dataset: 'revenue',
    };

    const drilldown = buildReportDrilldown(report);

    expect(drilldown.title).toBe('Revenue drill-down');
    expect(drilldown.columns).toEqual(['Period', 'Revenue', 'Margin']);
    expect(drilldown.rows[0]).toEqual({
      id: 'revenue-Jul',
      cells: ['Jul', '€32,000', '€8,400'],
    });
  });

  it('builds order-status drill-down rows', () => {
    const report: SavedReport = {
      id: 'report_2',
      name: 'Orders',
      chartType: 'bar',
      dataset: 'orders',
    };

    const drilldown = buildReportDrilldown(report);

    expect(drilldown.title).toBe('Orders drill-down');
    expect(drilldown.columns).toEqual(['Status', 'Orders']);
    expect(drilldown.rows.map((row) => row.cells)).toContainEqual(['Confirmed', '11']);
  });

  it('builds pipeline drill-down rows', () => {
    const report: SavedReport = {
      id: 'report_3',
      name: 'Pipeline',
      chartType: 'funnel',
      dataset: 'pipeline',
    };

    const drilldown = buildReportDrilldown(report);

    expect(drilldown.title).toBe('Pipeline drill-down');
    expect(drilldown.columns).toEqual(['Stage', 'Count', 'Conversion']);
    expect(drilldown.rows[0]).toEqual({
      id: 'pipeline-Leads',
      cells: ['Leads', '120', '100%'],
    });
  });
});
