import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { InlineEmptyState } from './inline-empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

export interface SettingsTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface SettingsTableProps<T> {
  columns: SettingsTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Compact settings/catalog table — lighter than CrudTable, for admin config rows.
 */
export function SettingsTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  emptyMessage = 'No entries yet',
  className,
}: SettingsTableProps<T>) {
  if (!rows.length) {
    return <InlineEmptyState text={emptyMessage} centered className="border-0 bg-transparent" />;
  }

  return (
    <div className={cn('overflow-hidden rounded-control border border-border/50', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.key} className={column.headerClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={getRowId(row)}
              className={cn(onRowClick && 'cursor-pointer')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
