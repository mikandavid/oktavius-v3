import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@oktavius/base-ui';
import { ExportIcon, SpinnerIcon } from '@/lib/icons';
import { ModulePage } from '@/components/common/PageLayout';

import { CrudTable, type BulkAction, type CrudColumn, type CrudRowAction } from './CrudTable';
import { exportToXlsx } from './exportGrid';
import { FilterToolbar, type FilterDef } from './FilterToolbar';
import { Pagination } from './Pagination';

export type { BulkAction, CrudColumn, CrudRowAction };

type ExportOptions = {
  fileName: string;
  sheetName?: string;
  label?: string;
  /** Override default export — receives all rows (not just current page) */
  onExport?: () => void | Promise<void>;
};

type CrudMainViewProps<T extends { id: string }> = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  headerActions?: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  values?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  toolbarTrailing?: ReactNode;
  rows: T[];
  /** All rows (unfiltered/unpaginated) used for export. Falls back to `rows` if omitted. */
  allRows?: T[];
  columns: CrudColumn<T>[];
  rowActions?: CrudRowAction<T>[];
  bulkActions?: BulkAction[];
  selectable?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  getRowHref?: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  highlightedId?: string;
  exportOptions?: ExportOptions;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function CrudMainView<T extends { id: string }>({
  title,
  subtitle,
  icon,
  headerActions,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  values,
  onFilterChange,
  onReset,
  toolbarTrailing,
  rows,
  allRows,
  columns,
  rowActions,
  bulkActions,
  selectable,
  emptyTitle,
  emptyDescription,
  getRowHref,
  onRowClick,
  sort,
  onSortChange,
  isLoading,
  isFetching,
  highlightedId,
  exportOptions,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: CrudMainViewProps<T>) {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const resolvedOnRowClick =
    onRowClick ?? (getRowHref ? (row: T) => navigate(getRowHref(row)) : undefined);

  const handleExport = async () => {
    if (!exportOptions) return;
    setIsExporting(true);
    try {
      if (exportOptions.onExport) {
        await exportOptions.onExport();
      } else {
        const exportData = (allRows ?? rows) as unknown as Record<string, unknown>[];
        await exportToXlsx(
          exportData,
          columns as unknown as CrudColumn<Record<string, unknown>>[],
          exportOptions.fileName,
          exportOptions.sheetName,
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const resolvedHeaderActions =
    exportOptions ? (
      <div className="flex items-center gap-2">
        {headerActions}
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading || rows.length === 0 || isExporting}
          onClick={() => void handleExport()}
        >
          {isExporting ? (
            <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ExportIcon className="h-3.5 w-3.5" />
          )}
          {exportOptions.label ?? 'Export'}
        </Button>
      </div>
    ) : headerActions;

  return (
    <ModulePage
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={resolvedHeaderActions}
      layoutClassName="min-w-0"
    >
      <div className="min-w-0 overflow-hidden rounded-card bg-card">
        <div className="border-b border-border/50">
          <FilterToolbar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            filters={filters}
            values={values}
            onFilterChange={onFilterChange}
            onReset={onReset}
            trailing={toolbarTrailing}
          />
        </div>
        <CrudTable
          data={rows}
          columns={columns}
          rowActions={rowActions}
          bulkActions={bulkActions}
          selectable={selectable}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          onRowClick={resolvedOnRowClick}
          sort={sort}
          onSortChange={onSortChange}
          isLoading={isLoading}
          isFetching={isFetching}
          highlightedId={highlightedId}
        />
        <div className="border-t border-border/50">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </ModulePage>
  );
}
