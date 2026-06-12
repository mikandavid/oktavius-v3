import { type ImportRow, parseImportFile } from './importFileParser';

export type ImportPreview = {
  columns: string[];
  rows: ImportRow[];
  totalRows: number;
};

export async function loadImportPreview(file: File, maxRows = 3): Promise<ImportPreview> {
  const rows = await parseImportFile(file);
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return {
    columns,
    rows: rows.slice(0, maxRows),
    totalRows: rows.length,
  };
}
