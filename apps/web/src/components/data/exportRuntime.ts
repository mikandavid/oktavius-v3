import type { CrudColumn } from './CrudTable';

export type ExportRuntimeAdapter = {
  startExport: (request: {
    resourceKey: string;
    fileName: string;
    columns: Array<{ key: string; header: string }>;
    filters?: Record<string, string>;
    search?: string;
    sort?: string;
  }) => Promise<{ downloadUrl?: string; jobId?: string }>;
};

export function chooseExportStrategy({
  runtime,
  rowCount,
  threshold = 500,
}: {
  runtime?: Pick<ExportRuntimeAdapter, 'startExport'>;
  rowCount: number;
  threshold?: number;
}): 'local' | 'server' {
  return runtime && rowCount > threshold ? 'server' : 'local';
}

export function exportColumnsForRuntime<T>(columns: CrudColumn<T>[]) {
  return columns
    .filter((column) => column.key !== '__select__' && column.key !== '__actions__')
    .map((column) => ({ key: String(column.key), header: column.header }));
}
