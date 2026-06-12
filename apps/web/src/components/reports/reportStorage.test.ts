import { describe, expect, it, vi } from 'vitest';

import {
  createApiReportStore,
  createLocalReportStore,
  createReport,
  DEFAULT_REPORTS,
  deleteReport,
  loadStoredReports,
  type ReportStore,
  type SavedReport,
  storeReports,
  updateReport,
} from './reportStorage';

function createStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('report storage helpers', () => {
  it('creates saved report configs with generated ids', () => {
    const report = createReport({
      name: ' Revenue dashboard ',
      chartType: 'bar',
      dataset: 'orders',
    });

    expect(report).toMatchObject({
      name: 'Revenue dashboard',
      chartType: 'bar',
      dataset: 'orders',
    });
    expect(report.id).toMatch(/^report_/);
  });

  it('loads default reports when storage is empty or invalid', () => {
    expect(loadStoredReports(createStorage(), 'reports')).toEqual(DEFAULT_REPORTS);
    expect(
      loadStoredReports(createStorage({ 'oktavius.reports.reports': 'not-json' }), 'reports'),
    ).toEqual(DEFAULT_REPORTS);
  });

  it('loads only valid stored reports', () => {
    const storage = createStorage({
      'oktavius.reports.reports': JSON.stringify([
        { id: 'report_1', name: 'Valid', chartType: 'line', dataset: 'revenue' },
        { id: 'report_2', name: 'Invalid chart', chartType: 'unknown', dataset: 'revenue' },
        { id: '', name: 'Invalid id', chartType: 'line', dataset: 'revenue' },
      ]),
    });

    expect(loadStoredReports(storage, 'reports')).toEqual([
      { id: 'report_1', name: 'Valid', chartType: 'line', dataset: 'revenue' },
    ]);
  });

  it('stores reports under a scoped key', () => {
    const storage = createStorage();
    const reports: SavedReport[] = [
      { id: 'report_1', name: 'Valid', chartType: 'line', dataset: 'revenue' },
    ];

    storeReports(storage, 'reports', reports);

    expect(loadStoredReports(storage, 'reports')).toEqual(reports);
  });

  it('exposes a report store adapter for generated or backend report persistence', async () => {
    const storage = createStorage();
    const store: ReportStore = createLocalReportStore(storage, 'reports');
    const reports: SavedReport[] = [
      { id: 'report_1', name: 'Valid', chartType: 'line', dataset: 'revenue' },
    ];

    await store.save(reports);
    expect(await store.load()).toEqual(reports);

    await store.clear();
    expect(await store.load()).toEqual(DEFAULT_REPORTS);
  });

  it('exposes an API store adapter for backend report persistence', async () => {
    const fetcher = vi.fn(async () =>
      response([
        { id: 'report_1', name: 'Valid', chartType: 'line', dataset: 'revenue' },
        { id: 'report_2', name: 'Invalid chart', chartType: 'unknown', dataset: 'revenue' },
      ]),
    );
    const store = createApiReportStore({
      endpoint: '/api/reports/saved',
      fetcher,
    });

    await expect(store.load()).resolves.toEqual([
      { id: 'report_1', name: 'Valid', chartType: 'line', dataset: 'revenue' },
    ]);
  });

  it('updates an existing report without changing list order', () => {
    const reports: SavedReport[] = [
      { id: 'report_1', name: 'Revenue', chartType: 'line', dataset: 'revenue' },
      { id: 'report_2', name: 'Orders', chartType: 'bar', dataset: 'orders' },
    ];

    expect(
      updateReport(reports, 'report_2', {
        name: 'Order pipeline',
        chartType: 'funnel',
        dataset: 'pipeline',
      }),
    ).toEqual([
      { id: 'report_1', name: 'Revenue', chartType: 'line', dataset: 'revenue' },
      { id: 'report_2', name: 'Order pipeline', chartType: 'funnel', dataset: 'pipeline' },
    ]);
  });

  it('deletes custom reports but preserves the default report', () => {
    const reports: SavedReport[] = [
      ...DEFAULT_REPORTS,
      { id: 'report_1', name: 'Revenue', chartType: 'line', dataset: 'revenue' },
    ];

    expect(deleteReport(reports, 'report_1')).toEqual(DEFAULT_REPORTS);
    expect(deleteReport(reports, 'report_default')).toEqual(reports);
  });
});
