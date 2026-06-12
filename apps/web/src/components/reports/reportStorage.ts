import type { ChartCardType } from '@oktavius/base-ui';

import { type ApiArrayStoreFetcher, createApiArrayStore } from '@/lib/apiArrayStore';

export type SavedReport = {
  id: string;
  name: string;
  chartType: ChartCardType;
  dataset: 'revenue' | 'orders' | 'pipeline';
};

type MaybePromise<T> = T | Promise<T>;

export type ReportStore = {
  load: () => MaybePromise<SavedReport[]>;
  save: (reports: SavedReport[]) => MaybePromise<void>;
  clear: () => MaybePromise<void>;
};

const REPORT_STORAGE_PREFIX = 'oktavius.reports';

const VALID_CHART_TYPES = new Set<ChartCardType>([
  'line',
  'multi-line',
  'area',
  'bar',
  'horizontal-bar',
  'combo',
  'pie',
  'stacked-bar',
  'radar',
  'gauge',
  'funnel',
  'sparkline',
]);

const VALID_DATASETS = new Set<SavedReport['dataset']>(['revenue', 'orders', 'pipeline']);

export const DEFAULT_REPORTS: SavedReport[] = [
  {
    id: 'report_default',
    name: 'Monthly revenue',
    chartType: 'line',
    dataset: 'revenue',
  },
];

export function buildReportStorageKey(storageKey: string) {
  return `${REPORT_STORAGE_PREFIX}.${storageKey}`;
}

function isSavedReport(value: unknown): value is SavedReport {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedReport>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.length > 0 &&
    !!candidate.chartType &&
    VALID_CHART_TYPES.has(candidate.chartType) &&
    !!candidate.dataset &&
    VALID_DATASETS.has(candidate.dataset)
  );
}

export function parseSavedReports(payload: unknown): SavedReport[] {
  return Array.isArray(payload) ? payload.filter(isSavedReport) : [];
}

export function createReport({ name, chartType, dataset }: Omit<SavedReport, 'id'>): SavedReport {
  return {
    id: `report_${Date.now()}`,
    name: name.trim(),
    chartType,
    dataset,
  };
}

export function updateReport(
  reports: SavedReport[],
  reportId: string,
  input: Omit<SavedReport, 'id'>,
): SavedReport[] {
  return reports.map((report) =>
    report.id === reportId
      ? {
          ...report,
          name: input.name.trim(),
          chartType: input.chartType,
          dataset: input.dataset,
        }
      : report,
  );
}

export function deleteReport(reports: SavedReport[], reportId: string): SavedReport[] {
  if (reportId === 'report_default') return reports;
  const nextReports = reports.filter((report) => report.id !== reportId);
  return nextReports.length > 0 ? nextReports : DEFAULT_REPORTS;
}

export function loadStoredReports(storage: Storage | undefined, storageKey: string): SavedReport[] {
  if (!storage) return DEFAULT_REPORTS;
  try {
    const raw = storage.getItem(buildReportStorageKey(storageKey));
    if (!raw) return DEFAULT_REPORTS;
    const validReports = parseSavedReports(JSON.parse(raw) as unknown);
    return validReports.length > 0 ? validReports : DEFAULT_REPORTS;
  } catch {
    return DEFAULT_REPORTS;
  }
}

export function createApiReportStore({
  endpoint,
  fetcher,
  headers,
}: {
  endpoint: string;
  fetcher?: ApiArrayStoreFetcher;
  headers?: Record<string, string>;
}): ReportStore {
  return createApiArrayStore({
    endpoint,
    fetcher,
    headers,
    fallback: DEFAULT_REPORTS,
    parse: parseSavedReports,
  });
}

export function storeReports(
  storage: Storage | undefined,
  storageKey: string,
  reports: SavedReport[],
) {
  if (!storage) return;
  storage.setItem(buildReportStorageKey(storageKey), JSON.stringify(reports));
}

export function clearStoredReports(storage: Storage | undefined, storageKey: string) {
  if (!storage) return;
  storage.removeItem(buildReportStorageKey(storageKey));
}

export function createLocalReportStore(
  storage: Storage | undefined,
  storageKey: string,
): ReportStore {
  return {
    load: () => loadStoredReports(storage, storageKey),
    save: (reports) => storeReports(storage, storageKey, reports),
    clear: () => clearStoredReports(storage, storageKey),
  };
}
