import {
  Button,
  type ChartCardType,
  Combobox,
  InlineEmptyState,
  Input,
  SectionCard,
  SettingsRow,
} from '@oktavius/base-ui';
import { useEffect, useMemo, useState } from 'react';

import { getWindowStorage } from '@/lib/storage/safeStorage';
import { appToast } from '@/lib/toast';

import { buildReportDrilldown } from './reportDrilldown';
import {
  createLocalReportStore,
  createReport,
  deleteReport,
  type ReportStore,
  type SavedReport,
  updateReport,
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
          <SectionCard
            title={activeReport.name}
            meta={`${activeReport.dataset} · ${activeReport.chartType}`}
          >
            <InlineEmptyState
              text={drilldown.emptyStateMessage ?? 'No report data source connected.'}
              centered
            />
          </SectionCard>
          <SectionCard title={drilldown.title} meta={drilldown.description}>
            {drilldown.rows.length === 0 ? (
              <InlineEmptyState
                text={drilldown.emptyStateMessage ?? 'No report data source connected.'}
                centered
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      {drilldown.columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="border-b border-border/70 px-3 py-2"
                        >
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
            )}
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
