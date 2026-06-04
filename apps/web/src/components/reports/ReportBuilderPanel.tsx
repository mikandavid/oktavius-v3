import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  ChartCard,
  Combobox,
  Input,
  SectionCard,
  SettingsRow,
  type ChartCardType,
} from '@oktavius/base-ui';

import { getWindowStorage } from '@/lib/storage/safeStorage';
import { appToast } from '@/lib/toast';

import { buildReportDrilldown } from './reportDrilldown';
import {
  createReport,
  createLocalReportStore,
  deleteReport,
  updateReport,
  type ReportStore,
  type SavedReport,
} from './reportStorage';

const DATASET_OPTIONS = [
  { value: 'revenue', label: 'Revenue trend' },
  { value: 'orders', label: 'Orders by status' },
  { value: 'pipeline', label: 'Sales pipeline' },
] as const;

const CHART_TYPE_OPTIONS: Array<{ value: ChartCardType; label: string }> = [
  { value: 'line', label: 'Line' },
  { value: 'multi-line', label: 'Multi-line' },
  { value: 'area', label: 'Area' },
  { value: 'bar', label: 'Bar' },
  { value: 'horizontal-bar', label: 'Horizontal bar' },
  { value: 'combo', label: 'Bar + line combo' },
  { value: 'pie', label: 'Pie / donut' },
  { value: 'stacked-bar', label: 'Stacked bar' },
  { value: 'radar', label: 'Radar' },
  { value: 'gauge', label: 'Gauge' },
  { value: 'funnel', label: 'Funnel' },
  { value: 'sparkline', label: 'Sparkline' },
];

const REVENUE_DATA = [
  { label: 'Jul', value: 32000 },
  { label: 'Aug', value: 38500 },
  { label: 'Sep', value: 41200 },
  { label: 'Oct', value: 39800 },
  { label: 'Nov', value: 45100 },
  { label: 'Dec', value: 51340 },
];

const ORDER_STATUS_DATA = [
  { label: 'Draft', value: 4 },
  { label: 'Confirmed', value: 11 },
  { label: 'Fulfilled', value: 18 },
  { label: 'Cancelled', value: 2 },
];

const PIPELINE_FUNNEL = [
  { label: 'Leads', value: 120 },
  { label: 'Qualified', value: 64 },
  { label: 'Proposal', value: 28 },
  { label: 'Won', value: 11 },
];

const STACKED_PIPELINE = [
  {
    label: 'Q1',
    value: 0,
    segments: [
      { key: 'New', value: 12 },
      { key: 'Active', value: 24 },
      { key: 'Won', value: 8 },
    ],
  },
  {
    label: 'Q2',
    value: 0,
    segments: [
      { key: 'New', value: 15 },
      { key: 'Active', value: 21 },
      { key: 'Won', value: 10 },
    ],
  },
  {
    label: 'Q3',
    value: 0,
    segments: [
      { key: 'New', value: 18 },
      { key: 'Active', value: 19 },
      { key: 'Won', value: 12 },
    ],
  },
];

const MULTI_LINE_REVENUE = [
  { label: 'Jul', revenue: 32000, margin: 8400 },
  { label: 'Aug', revenue: 38500, margin: 10200 },
  { label: 'Sep', revenue: 41200, margin: 11100 },
  { label: 'Oct', revenue: 39800, margin: 9800 },
  { label: 'Nov', revenue: 45100, margin: 12400 },
  { label: 'Dec', revenue: 51340, margin: 14200 },
];

const REVENUE_SERIES = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'margin', label: 'Margin' },
];

const COMBO_DATA = [
  { label: 'Jul', barValue: 38, lineValue: 32000 },
  { label: 'Aug', barValue: 44, lineValue: 38500 },
  { label: 'Sep', barValue: 41, lineValue: 41200 },
  { label: 'Oct', barValue: 36, lineValue: 39800 },
  { label: 'Nov', barValue: 47, lineValue: 45100 },
  { label: 'Dec', barValue: 52, lineValue: 51340 },
];

const TOP_CLIENTS = [
  { label: 'Apex Tech', value: 48 },
  { label: 'Northwind', value: 36 },
  { label: 'Contoso', value: 29 },
  { label: 'Fabrikam', value: 22 },
  { label: 'Globex', value: 18 },
];

const RADAR_KPIS = [
  { subject: 'Sales', actual: 82, target: 90 },
  { subject: 'Support', actual: 76, target: 80 },
  { subject: 'Delivery', actual: 88, target: 85 },
  { subject: 'Quality', actual: 91, target: 88 },
  { subject: 'Retention', actual: 74, target: 82 },
];

const RADAR_SERIES = [
  { key: 'actual', label: 'Actual' },
  { key: 'target', label: 'Target' },
];

function datasetPreview(type: ChartCardType, dataset: SavedReport['dataset']) {
  if (type === 'gauge') {
    return { gaugeValue: dataset === 'revenue' ? 78 : dataset === 'orders' ? 62 : 54 };
  }
  if (type === 'funnel') {
    return { funnelData: PIPELINE_FUNNEL };
  }
  if (type === 'stacked-bar') {
    return { stackedData: STACKED_PIPELINE };
  }
  if (type === 'pie') {
    return { data: ORDER_STATUS_DATA };
  }
  if (type === 'multi-line') {
    return { multiSeriesData: MULTI_LINE_REVENUE, series: REVENUE_SERIES };
  }
  if (type === 'combo') {
    return {
      comboData: COMBO_DATA,
      barLabel: 'Orders',
      lineLabel: 'Revenue',
    };
  }
  if (type === 'horizontal-bar') {
    return { data: TOP_CLIENTS };
  }
  if (type === 'radar') {
    return { radarData: RADAR_KPIS, series: RADAR_SERIES };
  }
  if (type === 'sparkline') {
    return { data: REVENUE_DATA, height: 56 };
  }
  return {
    data: dataset === 'revenue' ? REVENUE_DATA : ORDER_STATUS_DATA,
  };
}

/** Lightweight saved-report builder for dashboard/report modules. */
export function ReportBuilderPanel({
  storageKey = 'reports',
  store,
}: {
  storageKey?: string;
  store?: ReportStore;
}) {
  const [name, setName] = useState('Monthly revenue');
  const [chartType, setChartType] = useState<ChartCardType>('line');
  const [dataset, setDataset] = useState<SavedReport['dataset']>('revenue');
  const storage = getWindowStorage('localStorage');
  const localStore = useMemo(
    () => createLocalReportStore(storage, storageKey),
    [storage, storageKey],
  );
  const reportStore = store ?? localStore;
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeReportId, setActiveReportId] = useState('report_default');

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve(reportStore.load()).then((loadedReports) => {
      if (!cancelled) {
        setSavedReports(loadedReports);
        setActiveReportId(loadedReports[0]?.id ?? 'report_default');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reportStore]);

  const persistReports = (nextReports: SavedReport[]) => {
    setSavedReports(nextReports);
    void Promise.resolve(reportStore.save(nextReports)).catch((error: unknown) => {
      appToast.fromApiError(error, 'Reports could not be saved.');
    });
  };

  const activeReport =
    savedReports.find((report) => report.id === activeReportId) ?? savedReports[0] ?? null;

  const previewProps = useMemo(
    () => (activeReport ? datasetPreview(activeReport.chartType, activeReport.dataset) : {}),
    [activeReport],
  );
  const drilldown = useMemo(
    () => (activeReport ? buildReportDrilldown(activeReport) : null),
    [activeReport],
  );

  const saveReport = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const nextReport = createReport({
      name: trimmed,
      chartType,
      dataset,
    });
    const nextReports = [nextReport, ...savedReports];
    persistReports(nextReports);
    setActiveReportId(nextReport.id);
    appToast.success('Report saved.');
  };

  const updateActiveReport = () => {
    if (!activeReport) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const nextReports = updateReport(savedReports, activeReport.id, {
      name: trimmed,
      chartType,
      dataset,
    });
    persistReports(nextReports);
    appToast.success('Report updated.');
  };

  const deleteActiveReport = () => {
    if (!activeReport || activeReport.id === 'report_default') return;
    const nextReports = deleteReport(savedReports, activeReport.id);
    persistReports(nextReports);
    setActiveReportId(nextReports[0]?.id ?? 'report_default');
    appToast.success('Report deleted.');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <SectionCard title="Report builder" meta="Saved views">
        <div className="space-y-3">
          <SettingsRow label="Name" description="Shown on dashboards and exports.">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </SettingsRow>
          <SettingsRow label="Dataset">
            <Combobox
              value={dataset}
              onChange={(value) => setDataset((value as SavedReport['dataset']) ?? 'revenue')}
              options={DATASET_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </SettingsRow>
          <SettingsRow label="Chart type">
            <Combobox
              value={chartType}
              onChange={(value) => setChartType((value as ChartCardType) ?? 'line')}
              options={CHART_TYPE_OPTIONS}
            />
          </SettingsRow>
          <div className="flex flex-wrap gap-2">
            <Button variant="cta" size="sm" onClick={saveReport}>
              Save report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={updateActiveReport}
              disabled={!activeReport}
            >
              Update selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteActiveReport}
              disabled={!activeReport || activeReport.id === 'report_default'}
            >
              Delete
            </Button>
          </div>
          <div className="space-y-1 border-t border-border/50 pt-3">
            {savedReports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => {
                  setActiveReportId(report.id);
                  setName(report.name);
                  setChartType(report.chartType);
                  setDataset(report.dataset);
                }}
                className={
                  report.id === activeReportId
                    ? 'w-full rounded-control bg-muted px-2.5 py-2 text-left text-sm font-medium text-foreground'
                    : 'w-full rounded-control px-2.5 py-2 text-left text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }
              >
                {report.name}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {activeReport && drilldown ? (
        <div className="space-y-4">
          <ChartCard
            title={activeReport.name}
            meta={`${activeReport.dataset} · ${activeReport.chartType}`}
            type={activeReport.chartType}
            {...previewProps}
            valueFormatter={(value) =>
              activeReport.dataset === 'revenue'
                ? `€${value.toLocaleString('de-AT')}`
                : String(value)
            }
          />
          <SectionCard title={drilldown.title} meta={drilldown.description}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    {drilldown.columns.map((column) => (
                      <th key={column} scope="col" className="border-b border-border/70 px-3 py-2">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drilldown.rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 last:border-b-0">
                      {row.cells.map((cell, index) => (
                        <td
                          key={`${row.id}-${index}`}
                          className={
                            index === 0
                              ? 'px-3 py-2 font-medium text-foreground'
                              : 'px-3 py-2 text-muted-foreground'
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}

export {
  REVENUE_DATA,
  ORDER_STATUS_DATA,
  PIPELINE_FUNNEL,
  STACKED_PIPELINE,
  MULTI_LINE_REVENUE,
  REVENUE_SERIES,
  COMBO_DATA,
  TOP_CLIENTS,
  RADAR_KPIS,
  RADAR_SERIES,
};
