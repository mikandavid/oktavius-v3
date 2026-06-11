import type { SavedReport } from './reportStorage';

export type ReportDrilldownRow = {
  id: string;
  cells: string[];
};

export type ReportDrilldown = {
  title: string;
  description: string;
  columns: string[];
  rows: ReportDrilldownRow[];
  emptyStateMessage?: string;
};

export const NO_REPORT_DATA_SOURCE_MESSAGE = 'No report data source connected.';

export function buildReportDrilldown(report: SavedReport): ReportDrilldown {
  if (report.dataset === 'orders') {
    return {
      title: 'Orders drill-down',
      description: 'Order volume by current status.',
      columns: ['Status', 'Orders'],
      rows: [],
      emptyStateMessage: NO_REPORT_DATA_SOURCE_MESSAGE,
    };
  }

  if (report.dataset === 'pipeline') {
    return {
      title: 'Pipeline drill-down',
      description: 'Pipeline stages with conversion against the first stage.',
      columns: ['Stage', 'Count', 'Conversion'],
      rows: [],
      emptyStateMessage: NO_REPORT_DATA_SOURCE_MESSAGE,
    };
  }

  return {
    title: 'Revenue drill-down',
    description: 'Revenue and margin by reporting period.',
    columns: ['Period', 'Revenue', 'Margin'],
    rows: [],
    emptyStateMessage: NO_REPORT_DATA_SOURCE_MESSAGE,
  };
}
