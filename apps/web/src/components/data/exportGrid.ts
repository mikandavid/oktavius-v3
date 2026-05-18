/**
 * Export helper — lazy-loads xlsx, converts data + column headers to a workbook.
 *
 * Pass `data` and `columns` from CrudTable directly. No grid API required.
 * The column `header` string becomes the spreadsheet column header.
 * Typed cells (currency, date, boolean) are normalized to plain values.
 */

import type { CrudColumn } from './CrudTable';

function normalizeValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function exportToXlsx<T extends Record<string, unknown>>(
  data: T[],
  columns: CrudColumn<T>[],
  fileName: string,
  sheetName = 'Data',
) {
  const XLSX = await import('xlsx');

  const headers = columns
    .filter((col) => col.key !== '__select__' && col.key !== '__actions__')
    .map((col) => col.header);

  const rows = data.map((row) =>
    columns
      .filter((col) => col.key !== '__select__' && col.key !== '__actions__')
      .map((col) => normalizeValue(row[col.key])),
  );

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}
