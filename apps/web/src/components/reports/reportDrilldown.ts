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
};

function formatCurrency(value: number) {
  return `€${value.toLocaleString('en-US')}`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

const REVENUE_DRILLDOWN = [
  { label: 'Jul', revenue: 32000, margin: 8400 },
  { label: 'Aug', revenue: 38500, margin: 10200 },
  { label: 'Sep', revenue: 41200, margin: 11100 },
  { label: 'Oct', revenue: 39800, margin: 9800 },
  { label: 'Nov', revenue: 45100, margin: 12400 },
  { label: 'Dec', revenue: 51340, margin: 14200 },
];

const ORDER_STATUS_DRILLDOWN = [
  { label: 'Draft', value: 4 },
  { label: 'Confirmed', value: 11 },
  { label: 'Fulfilled', value: 18 },
  { label: 'Cancelled', value: 2 },
];

const PIPELINE_DRILLDOWN = [
  { label: 'Leads', value: 120 },
  { label: 'Qualified', value: 64 },
  { label: 'Proposal', value: 28 },
  { label: 'Won', value: 11 },
];

export function buildReportDrilldown(report: SavedReport): ReportDrilldown {
  if (report.dataset === 'orders') {
    return {
      title: 'Orders drill-down',
      description: 'Order volume by current status.',
      columns: ['Status', 'Orders'],
      rows: ORDER_STATUS_DRILLDOWN.map((item) => ({
        id: `orders-${item.label}`,
        cells: [item.label, String(item.value)],
      })),
    };
  }

  if (report.dataset === 'pipeline') {
    const firstValue = PIPELINE_DRILLDOWN[0]?.value ?? 1;
    return {
      title: 'Pipeline drill-down',
      description: 'Pipeline stages with conversion against the first stage.',
      columns: ['Stage', 'Count', 'Conversion'],
      rows: PIPELINE_DRILLDOWN.map((item) => ({
        id: `pipeline-${item.label}`,
        cells: [item.label, String(item.value), formatPercent((item.value / firstValue) * 100)],
      })),
    };
  }

  return {
    title: 'Revenue drill-down',
    description: 'Revenue and margin by reporting period.',
    columns: ['Period', 'Revenue', 'Margin'],
    rows: REVENUE_DRILLDOWN.map((item) => ({
      id: `revenue-${item.label}`,
      cells: [item.label, formatCurrency(item.revenue), formatCurrency(item.margin)],
    })),
  };
}
