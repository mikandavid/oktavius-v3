import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { PageHeaderActions, PageHeaderExportButton } from '@/components/common/PageHeaderButtons';

import { CrudTable, type BulkAction, type CrudColumn, type CrudRowAction } from './CrudTable';
import { exportToXlsx } from './exportGrid';
import { FilterToolbar, type FilterDef } from './FilterToolbar';
import { Pagination } from './Pagination';
import { buildStandardListCrudActions } from './standardListCrud';

export type { BulkAction, CrudColumn, CrudRowAction };
export { buildStandardListCrudActions } from './standardListCrud';

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
  /**
   * Enables checkbox multiselect, row menu (Edit / Delete), and bulk bar (Edit / Delete selected).
   * Requires `getRowHref`. Set `enableListCrud={false}` to opt out.
   */
  entityLabel?: string;
  pluralLabel?: string;
  enableListCrud?: boolean;
  onDeleteRows?: (ids: string[]) => void;
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
  entityLabel,
  pluralLabel,
  enableListCrud = true,
  onDeleteRows,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const resolvedOnRowClick =
    onRowClick ?? (getRowHref ? (row: T) => navigate(getRowHref(row)) : undefined);

  const standardCrud = useMemo(() => {
    if (!enableListCrud || !entityLabel || !getRowHref) return null;
    return buildStandardListCrudActions({
      entityLabel,
      pluralLabel,
      getDetailHref: getRowHref,
      navigate,
      onDelete: onDeleteRows,
      onAfterDelete: () => setSelectedIds([]),
    });
  }, [enableListCrud, entityLabel, pluralLabel, getRowHref, navigate, onDeleteRows]);

  const resolvedSelectable = selectable ?? standardCrud?.selectable ?? false;
  const resolvedRowActions = [...(standardCrud?.rowActions ?? []), ...(rowActions ?? [])];
  const resolvedBulkActions = [...(standardCrud?.bulkActions ?? []), ...(bulkActions ?? [])];

  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

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
    exportOptions || headerActions ? (
      <PageHeaderActions>
        {exportOptions ? (
          <PageHeaderExportButton
            label={exportOptions.label ?? 'Export'}
            disabled={isLoading || rows.length === 0 || isExporting}
            isLoading={isExporting}
            onClick={() => void handleExport()}
          />
        ) : null}
        {headerActions}
      </PageHeaderActions>
    ) : undefined;

  return (
    <ModulePage
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={resolvedHeaderActions}
      layoutClassName="min-w-0 w-full max-w-full"
    >
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-card bg-card">
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
          columnStretch="all"
          data={rows}
          columns={columns}
          rowActions={resolvedRowActions}
          bulkActions={resolvedBulkActions}
          selectable={resolvedSelectable}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
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
