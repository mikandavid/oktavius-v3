import { Grid, useClientDataSource } from '@1771technologies/lytenyte-core';
import { cn } from '@oktavius/base-ui';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { EMPTY_PERMISSION_SUBJECT, permitted } from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { CrudTableBulkActionBar } from './CrudTableBulkActionBar';
import { buildActionsColumn, buildDataColumns, buildSelectColumn } from './crudTableColumns';
import {
  type ColumnStretchMode,
  type CrudGridApi,
  type CrudGridSpec,
  useCrudColumnState,
} from './crudTableColumnState';
import {
  CRUD_TABLE_GRID_CHROME_EXTRA_PX,
  CRUD_TABLE_HEADER_HEIGHT_PX,
  crudTableRowHeightPx,
} from './crudTableDensity';
import { CrudTableLoadingState } from './CrudTableLoadingState';
import { CrudTableMobileList } from './CrudTableMobileList';
import type { BulkAction, CrudColumn, CrudRowAction } from './crudTableTypes';
import {
  BREAKPOINT_MIN_WIDTHS,
  resolveEffectiveTableWidth,
  shouldHideForViewport,
  toggleAllIds,
  toggleId,
} from './gridUtils';
import { useCrudTableConfirm } from './useCrudTableConfirm';

export type { CrudGridApi, CrudGridSpec } from './crudTableColumnState';
export type { BulkAction, ColumnType, CrudColumn, CrudRowAction } from './crudTableTypes';

const LEAF_ID_FN = <T extends { id: string }>(item: T) => item.id;

export interface CrudTableProps<T extends { id: string }> {
  data: T[];
  columns: CrudColumn<T>[];
  isLoading?: boolean;
  isFetching?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  sort?: string;
  onSortChange?: (sort: string) => void;
  rowActions?: CrudRowAction<T>[];
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: BulkAction[];
  compact?: boolean;
  highlightedId?: string;
  virtualizationMode?: 'auto' | 'always' | 'never';
  virtualizationThreshold?: number;
  columnStretch?: ColumnStretchMode;
  columnStateStorageKey?: string;
  gridRef?: React.Ref<CrudGridApi<T>>;
}

export function CrudTable<T extends { id: string }>({
  data,
  columns,
  isLoading = false,
  isFetching = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sort,
  onSortChange,
  rowActions = [],
  onRowClick,
  selectable = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  bulkActions = [],
  compact = false,
  highlightedId,
  virtualizationMode = 'auto',
  virtualizationThreshold = 100,
  columnStretch = 'all',
  columnStateStorageKey,
  gridRef,
}: CrudTableProps<T>) {
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );

  const { confirmDialog, setConfirmDialog, invokeBulkAction, invokeRowAction, crudConfirm } =
    useCrudTableConfirm<T>();

  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useLayoutEffect(() => {
    const node = gridContainerRef.current;
    if (!node || columnStretch === 'none') return undefined;

    const updateWidth = () => {
      const next = node.clientWidth;
      setContainerWidth((current) => (current === next ? current : next));
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, [columnStretch, rows.length]);

  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds;
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const permittedColumns = useMemo(
    () => columns.filter((column) => permitted(column.permission, permissionSubject)),
    [columns, permissionSubject],
  );
  const permittedRowActions = useMemo(
    () => rowActions.filter((action) => permitted(action.permission, permissionSubject)),
    [permissionSubject, rowActions],
  );
  const permittedBulkActions = useMemo(
    () => bulkActions.filter((action) => permitted(action.permission, permissionSubject)),
    [bulkActions, permissionSubject],
  );
  const hasActions = permittedRowActions.length > 0;

  const sortRef = useRef(sort);
  sortRef.current = sort;
  const onSortChangeRef = useRef(onSortChange);
  onSortChangeRef.current = onSortChange;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const setSelectedIdsRef = useRef(setSelectedIds);
  setSelectedIdsRef.current = setSelectedIds;
  const rowActionsRef = useRef(permittedRowActions);
  rowActionsRef.current = permittedRowActions;
  const highlightedIdRef = useRef(highlightedId);
  highlightedIdRef.current = highlightedId;
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;
  const selectableRef = useRef(selectable);
  selectableRef.current = selectable;

  const visibleColumns = useMemo(() => {
    const effectiveWidth = resolveEffectiveTableWidth(containerWidth, viewportWidth);
    return permittedColumns.filter(
      (column) => !shouldHideForViewport(column.hideBelow, effectiveWidth),
    );
  }, [permittedColumns, containerWidth, viewportWidth]);

  const effectiveTableWidth = resolveEffectiveTableWidth(containerWidth, viewportWidth);
  const useMobileLayout = effectiveTableWidth > 0 && effectiveTableWidth < BREAKPOINT_MIN_WIDTHS.sm;

  const structuralColumns = useMemo(() => {
    return [
      ...(selectable ? [buildSelectColumn<T>({ rowIds, selectedIds, setSelectedIds })] : []),
      ...buildDataColumns<T>({
        visibleColumns,
        hasActions,
        columnStretch,
        sortRef,
        onSortChangeRef,
        highlightedIdRef,
      }),
      ...(hasActions ? [buildActionsColumn<T>({ rowActionsRef, invokeRowAction })] : []),
    ];
  }, [
    columnStretch,
    hasActions,
    invokeRowAction,
    selectable,
    selectedIds,
    rowIds,
    setSelectedIds,
    visibleColumns,
  ]);

  const { gridColumns, handleColumnsChange } = useCrudColumnState<T>({
    structuralColumns,
    columnStretch,
    columnStateStorageKey,
    permittedColumns,
  });

  const rowSource = useClientDataSource<T>({
    data: rows,
    leafIdFn: LEAF_ID_FN,
  });

  const gridHeight = useMemo(() => {
    const rowHeight = crudTableRowHeightPx(compact);
    const target = rows.length * rowHeight + CRUD_TABLE_GRID_CHROME_EXTRA_PX;
    return Math.min(640, Math.max(220, target));
  }, [compact, rows.length]);

  const shouldVirtualize = useMemo(() => {
    if (isPrinting) return false;
    if (virtualizationMode === 'always') return true;
    if (virtualizationMode === 'never') return false;
    return rows.length > virtualizationThreshold;
  }, [isPrinting, rows.length, virtualizationMode, virtualizationThreshold]);

  const gridStyles = useMemo<Grid.Props<CrudGridSpec<T>>['styles']>(
    () => ({
      viewport: {
        className: 'w-full min-w-0 max-w-full',
        style: { width: '100%', maxWidth: '100%' },
      },
      row: {
        className: cn(
          'group/row',
          onRowClick &&
            'cursor-pointer transition-colors hover:bg-muted/40 focus-within:bg-muted/40',
        ),
      },
    }),
    [onRowClick],
  );

  const gridEvents = useMemo<Grid.Events<CrudGridSpec<T>>>(
    () => ({
      row: {
        keyDown: ({ event, row }) => {
          if (row.kind !== 'leaf' || !row.data) return;

          const key = event.key;
          if (key !== 'Enter' && key !== ' ' && key !== 'Spacebar') return;

          const target = event.target as HTMLElement | null;
          const isInteractiveTarget = Boolean(
            target?.closest(
              'button,a,input,textarea,select,[role="menuitem"],[role="button"],[contenteditable="true"]',
            ),
          );
          if (isInteractiveTarget) return;

          if (key === 'Enter' && onRowClickRef.current) {
            onRowClickRef.current(row.data);
            return;
          }

          if ((key === ' ' || key === 'Spacebar') && selectableRef.current) {
            event.preventDefault();
            setSelectedIdsRef.current(toggleId(selectedIdsRef.current, row.data.id));
          }
        },
        click: ({ row }) => {
          if (row.kind !== 'leaf' || !row.data || !onRowClickRef.current) return;
          onRowClickRef.current(row.data);
        },
      },
    }),
    [],
  );

  if (isLoading || (rows.length === 0 && isFetching)) {
    return (
      <CrudTableLoadingState
        compact={compact}
        columns={visibleColumns}
        selectable={selectable}
        hasActions={hasActions}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? 'No data found'}
        description={emptyDescription}
        action={emptyAction}
        compact={compact}
      />
    );
  }

  const gridReady = columnStretch === 'none' || containerWidth > 0 || rows.length > 0;

  return (
    <div className="crud-table-host flex w-full max-w-full min-w-0 flex-col overflow-x-hidden">
      <CrudTableBulkActionBar
        selectedCount={selectedIds.length}
        actions={permittedBulkActions}
        selectedIds={selectedIds}
        rowIds={rowIds}
        onClear={() => setSelectedIds([])}
        onToggleAll={() => setSelectedIds(toggleAllIds(rowIds, selectedIds))}
        invokeBulkAction={invokeBulkAction}
        permissionSubject={permissionSubject}
      />
      {useMobileLayout ? (
        <CrudTableMobileList
          rows={rows}
          columns={visibleColumns}
          selectable={selectable}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowActions={permittedRowActions}
          onRowClick={onRowClick}
          highlightedId={highlightedId}
          compact={compact}
          onRowActionConfirm={(action, item) => setConfirmDialog({ mode: 'row', action, item })}
        />
      ) : (
        <div
          ref={gridContainerRef}
          className="relative w-full max-w-full min-w-0 overflow-x-hidden bg-card"
        >
          <div style={{ height: gridHeight, width: '100%' }}>
            {isFetching ? (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
                <div className="h-full w-full animate-[progress-slide_1.2s_ease-in-out_infinite] bg-primary/60" />
              </div>
            ) : null}
            {gridReady ? (
              <Grid<CrudGridSpec<T>>
                ref={gridRef}
                columns={gridColumns}
                onColumnsChange={handleColumnsChange}
                columnSizeToFit={columnStretch !== 'none'}
                rowSource={rowSource}
                headerHeight={CRUD_TABLE_HEADER_HEIGHT_PX}
                rowHeight={crudTableRowHeightPx(compact)}
                rowAlternateAttr
                virtualizeRows={shouldVirtualize}
                virtualizeCols={false}
                columnDoubleClickToAutosize
                editMode="readonly"
                styles={gridStyles}
                events={gridEvents}
              />
            ) : null}
          </div>
        </div>
      )}

      {crudConfirm ? (
        <ConfirmActionDialog
          open={Boolean(confirmDialog)}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
          title={crudConfirm.title}
          description={crudConfirm.description}
          confirmLabel={crudConfirm.confirmLabel}
          confirmVariant={crudConfirm.confirmVariant}
          onConfirm={crudConfirm.onConfirm}
        />
      ) : null}
    </div>
  );
}
