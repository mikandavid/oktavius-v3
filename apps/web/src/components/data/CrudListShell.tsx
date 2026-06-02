import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { permissionSubjectFor } from '@/lib/permissions';

import { CrudTable, type BulkAction, type CrudColumn, type CrudRowAction } from './CrudTable';
import { filterCrudListPermissions } from './crudListPermissions';
import { FilterToolbar, type FilterDef } from './FilterToolbar';
import { Pagination } from './Pagination';
import { buildStandardListCrudActions } from './standardListCrud';

export type CrudListShellProps<T extends { id: string }> = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  values?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  toolbarTrailing?: ReactNode;
  rows: T[];
  columns: CrudColumn<T>[];
  rowActions?: CrudRowAction<T>[];
  bulkActions?: BulkAction[];
  selectable?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  getRowHref?: (row: T) => string;
  entityLabel?: string;
  pluralLabel?: string;
  enableListCrud?: boolean;
  allowDeleteRows?: boolean;
  onDeleteRows?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  highlightedId?: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/** Filter toolbar + CrudTable + pagination — embed inside ModulePage or tabs. */
export function CrudListShell<T extends { id: string }>({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  values,
  onFilterChange,
  onReset,
  toolbarTrailing,
  rows,
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
  allowDeleteRows = true,
  onDeleteRows,
  onRowClick,
  sort,
  onSortChange,
  isLoading,
  isFetching,
  highlightedId,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  className,
}: CrudListShellProps<T>) {
  const navigate = useNavigate();
  const { activeMembership, currentUser } = useDemoData();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const permissionSubject = useMemo(
    () => permissionSubjectFor(currentUser, activeMembership),
    [activeMembership, currentUser],
  );

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
      allowDelete: allowDeleteRows,
      onAfterDelete: () => setSelectedIds([]),
    });
  }, [
    allowDeleteRows,
    enableListCrud,
    entityLabel,
    pluralLabel,
    getRowHref,
    navigate,
    onDeleteRows,
  ]);

  const resolvedSelectable = selectable ?? standardCrud?.selectable ?? false;
  const resolvedRowActions = useMemo(
    () => [...(standardCrud?.rowActions ?? []), ...(rowActions ?? [])],
    [rowActions, standardCrud],
  );
  const resolvedBulkActions = useMemo(
    () => [...(standardCrud?.bulkActions ?? []), ...(bulkActions ?? [])],
    [bulkActions, standardCrud],
  );
  const permittedListParts = useMemo(
    () =>
      filterCrudListPermissions({
        columns,
        rowActions: resolvedRowActions,
        bulkActions: resolvedBulkActions,
        subject: permissionSubject,
      }),
    [columns, permissionSubject, resolvedBulkActions, resolvedRowActions],
  );

  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

  return (
    <div className={className ?? 'w-full max-w-full min-w-0 overflow-hidden rounded-card bg-card'}>
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
        columns={permittedListParts.columns}
        rowActions={permittedListParts.rowActions}
        bulkActions={permittedListParts.bulkActions}
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
  );
}
