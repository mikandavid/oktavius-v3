import { Grid, useClientDataSource } from '@1771technologies/lytenyte-core';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { MoreIcon, SortAscIcon, SortDescIcon, SortIcon as SortUnsortedIcon } from '@/lib/icons';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from '@oktavius/base-ui';

import { cn } from '@oktavius/base-ui';

import { EmptyState } from '@/components/common/EmptyState';

import {
  CRUD_TABLE_CELL_INNER_BASE,
  CRUD_TABLE_COLUMN_PADDING_ACTIONS,
  CRUD_TABLE_COLUMN_PADDING_SELECT,
  CRUD_TABLE_GRID_CHROME_EXTRA_PX,
  CRUD_TABLE_HEADER_HEIGHT_PX,
  CRUD_TABLE_HEADER_INNER_BASE,
  crudTableAlignClass,
  crudTableColumnPaddingClass,
  crudTableRowHeightPx,
  resolveCrudColumnAlign,
} from './crudTableDensity';
import {
  computeMinTableWidth,
  nextSortValue,
  parseCssSizeToPx,
  resolveEffectiveTableWidth,
  shouldHideForViewport,
  sortValueForColumn,
  toggleAllIds,
  toggleId,
  BREAKPOINT_MIN_WIDTHS,
} from './gridUtils';
import { renderTypedCell, shouldTruncateCell } from './crudTableCells';
import { CrudTableMobileList } from './CrudTableMobileList';
import type { BulkAction, ColumnType, CrudColumn, CrudRowAction } from './crudTableTypes';

export type { BulkAction, ColumnType, CrudColumn, CrudRowAction } from './crudTableTypes';

type CrudGridColumnState = {
  sort?: 'asc' | 'desc' | null;
};

export type CrudGridSpec<T> = Grid.GridSpec<T, CrudGridColumnState>;
export type CrudGridApi<T> = Grid.API<CrudGridSpec<T>>;

const DEFAULT_RESIZE_MIN_WIDTH_PX = 80;
const DEFAULT_RESIZE_MAX_WIDTH_PX = 1200;
const DEFAULT_TRUNCATE_MAX_REM = '36rem';
const TABLE_SELECTION_CHECKBOX_CLASS =
  'border-border/80 data-[state=checked]:border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground data-[state=indeterminate]:border-sidebar-primary data-[state=indeterminate]:bg-sidebar-primary/80 data-[state=indeterminate]:text-sidebar-primary-foreground';

const DEFAULT_WIDTH_BY_TYPE: Record<ColumnType, string> = {
  text: '18rem',
  status: '9rem',
  date: '11rem',
  currency: '11rem',
  boolean: '6rem',
  badge: '9rem',
};

const SKELETON_WIDTHS: Record<ColumnType, string> = {
  text: 'w-24',
  status: 'w-16 rounded-full',
  date: 'w-20',
  currency: 'ml-auto w-14',
  boolean: 'w-4',
  badge: 'w-16 rounded-full',
};

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
  columnStretch?: 'first' | 'all' | 'none';
  columnStateStorageKey?: string;
  gridRef?: React.Ref<CrudGridApi<T>>;
}

type PersistedColumnState = {
  v: 1;
  columns: Array<{
    id: string;
    width?: number;
    widthMin?: number;
    widthMax?: number;
    hide?: boolean;
    pin?: Grid.Column<CrudGridSpec<unknown>>['pin'];
  }>;
};

function TruncatedCell({
  children,
  maxWidth,
}: {
  children: React.ReactNode;
  maxWidth?: string | number;
}) {
  const textContent =
    typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;

  const maxWidthStyle =
    maxWidth !== undefined && maxWidth !== null
      ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }
      : undefined;

  return (
    <span className="block min-w-0 truncate" style={maxWidthStyle} title={textContent}>
      {children}
    </span>
  );
}

function SortIcon({ sort, columnKey }: { sort: string | undefined; columnKey: string }) {
  if (sort === columnKey) return <SortAscIcon className="h-3.5 w-3.5" />;
  if (sort === `-${columnKey}`) return <SortDescIcon className="h-3.5 w-3.5" />;
  return <SortUnsortedIcon className="h-3.5 w-3.5 text-muted-foreground/60" />;
}

function LoadingStateWithColumns<T>({
  compact,
  columns,
  selectable,
  hasActions,
}: {
  compact?: boolean;
  columns: CrudColumn<T>[];
  selectable: boolean;
  hasActions: boolean;
}) {
  const rows = compact ? 6 : 8;

  return (
    <div className="overflow-hidden bg-background">
      <div className="border-b bg-muted/20 px-5 py-2">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-1 px-4 py-2.5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn('flex items-center gap-2 rounded-sm pl-1 pr-2', compact ? 'h-9' : 'h-11')}
          >
            {selectable ? <Skeleton className="h-3.5 w-3.5 rounded" /> : null}
            {columns.map((column) => (
              <Skeleton
                key={`${rowIndex}-${column.key}`}
                className={cn('h-3.5 shrink-0', SKELETON_WIDTHS[column.type ?? 'text'])}
              />
            ))}
            {hasActions ? <Skeleton className="ml-auto h-6 w-6 rounded" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function bulkActionVisible(action: BulkAction, selectedCount: number) {
  if (action.minSelection != null && selectedCount < action.minSelection) return false;
  if (action.maxSelection != null && selectedCount > action.maxSelection) return false;
  return true;
}

function BulkActionBar({
  selectedCount,
  actions,
  selectedIds,
  rowIds,
  onClear,
  onToggleAll,
  invokeBulkAction,
}: {
  selectedCount: number;
  actions: BulkAction[];
  selectedIds: string[];
  rowIds: string[];
  onClear: () => void;
  onToggleAll: () => void;
  invokeBulkAction: (action: BulkAction, ids: string[]) => void;
}) {
  const visibleActions = actions.filter((action) => bulkActionVisible(action, selectedCount));
  if (selectedCount === 0 || visibleActions.length === 0) return null;

  const allRowsSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
  const hasPartialSelection = !allRowsSelected && rowIds.some((id) => selectedIds.includes(id));

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sidebar-primary/15 bg-sidebar-primary/[0.06] px-5 py-2"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Checkbox
          className={TABLE_SELECTION_CHECKBOX_CLASS}
          checked={allRowsSelected ? true : hasPartialSelection ? 'indeterminate' : false}
          aria-label="Select all on this page"
          onCheckedChange={onToggleAll}
        />
        <span className="truncate text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {visibleActions.map((action) => (
          <Button
            key={action.key}
            variant={action.destructive ? 'destructive' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 bg-background/80"
            onClick={() => invokeBulkAction(action, selectedIds)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

type ColumnStretchMode = 'first' | 'all' | 'none';

function mergeGridColumns<Spec extends CrudGridSpec<unknown>>(
  previous: Grid.Column<Spec>[],
  nextBase: Grid.Column<Spec>[],
  stretch: ColumnStretchMode,
): Grid.Column<Spec>[] {
  const previousById = new Map(previous.map((column) => [column.id, column]));
  const baseById = new Map(nextBase.map((column) => [column.id, column]));

  const orderedIds = [
    ...previous.map((column) => column.id).filter((id) => baseById.has(id)),
    ...nextBase.map((column) => column.id).filter((id) => !previousById.has(id)),
  ];

  return orderedIds
    .map((id) => {
      const base = baseById.get(id);
      if (!base) return null;

      const previousColumn = previousById.get(id);
      if (!previousColumn) return base;

      if (stretch === 'all') {
        return {
          ...base,
          hide: previousColumn.hide ?? base.hide,
          pin: previousColumn.pin ?? base.pin,
        };
      }

      return {
        ...previousColumn,
        ...base,
        width: previousColumn.width ?? base.width,
        widthMin: previousColumn.widthMin ?? base.widthMin,
        widthMax: previousColumn.widthMax ?? base.widthMax,
        widthFlex: previousColumn.widthFlex ?? base.widthFlex,
      };
    })
    .filter((column): column is Grid.Column<Spec> => Boolean(column));
}

function applyPersistedColumns<Spec extends CrudGridSpec<unknown>>(
  baseColumns: Grid.Column<Spec>[],
  persistedState: PersistedColumnState,
  stretch: ColumnStretchMode,
): Grid.Column<Spec>[] {
  const baseById = new Map(baseColumns.map((column) => [column.id, column]));
  const persistedById = new Map(persistedState.columns.map((column) => [column.id, column]));
  const persistedIds = new Set(persistedState.columns.map((column) => column.id));
  const persistWidths = stretch !== 'all';

  const mergedInPersistedOrder = persistedState.columns
    .map((persistedColumn): Grid.Column<Spec> | null => {
      const baseColumn = baseById.get(persistedColumn.id);
      if (!baseColumn) return null;

      return {
        ...baseColumn,
        ...(persistWidths
          ? {
              width: persistedColumn.width ?? baseColumn.width,
              widthMin: persistedColumn.widthMin ?? baseColumn.widthMin,
              widthMax: persistedColumn.widthMax ?? baseColumn.widthMax,
            }
          : {}),
        hide: persistedColumn.hide ?? baseColumn.hide,
        pin: persistedColumn.pin ?? baseColumn.pin,
      };
    })
    .filter((column): column is Grid.Column<Spec> => column !== null);

  const appendedNewColumns = baseColumns
    .filter((column) => !persistedIds.has(column.id))
    .map((column) => {
      const persistedColumn = persistedById.get(column.id);
      if (!persistedColumn) return column;
      return {
        ...column,
        ...(persistWidths
          ? {
              width: persistedColumn.width ?? column.width,
              widthMin: persistedColumn.widthMin ?? column.widthMin,
              widthMax: persistedColumn.widthMax ?? column.widthMax,
            }
          : {}),
        hide: persistedColumn.hide ?? column.hide,
        pin: persistedColumn.pin ?? column.pin,
      };
    });

  return [...mergedInPersistedOrder, ...appendedNewColumns];
}

function toPersistedColumnState<Spec extends CrudGridSpec<unknown>>(
  columns: Grid.Column<Spec>[],
  stretch: ColumnStretchMode,
): PersistedColumnState {
  const persistWidths = stretch !== 'all';
  return {
    v: 1,
    columns: columns.map((column) => ({
      id: column.id,
      ...(persistWidths
        ? {
            width: column.width,
            widthMin: column.widthMin,
            widthMax: column.widthMax,
          }
        : {}),
      hide: column.hide,
      pin: column.pin,
    })),
  };
}

function getAriaSort(sort: string | undefined, key: string): 'ascending' | 'descending' | 'none' {
  if (sort === key) return 'ascending';
  if (sort === `-${key}`) return 'descending';
  return 'none';
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
  const [confirmDialog, setConfirmDialog] = useState<
    | { mode: 'row'; action: CrudRowAction<T>; item: T }
    | { mode: 'bulk'; action: BulkAction; ids: string[] }
    | null
  >(null);

  const invokeBulkAction = useCallback((action: BulkAction, ids: string[]) => {
    if (action.confirm) {
      setConfirmDialog({ mode: 'bulk', action, ids });
      return;
    }
    action.onClick(ids);
  }, []);

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
  const hasActions = rowActions.length > 0;

  const sortRef = useRef(sort);
  sortRef.current = sort;
  const onSortChangeRef = useRef(onSortChange);
  onSortChangeRef.current = onSortChange;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const setSelectedIdsRef = useRef(setSelectedIds);
  setSelectedIdsRef.current = setSelectedIds;
  const rowIdsRef = useRef(rowIds);
  rowIdsRef.current = rowIds;
  const rowActionsRef = useRef(rowActions);
  rowActionsRef.current = rowActions;
  const highlightedIdRef = useRef(highlightedId);
  highlightedIdRef.current = highlightedId;
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;
  const selectableRef = useRef(selectable);
  selectableRef.current = selectable;

  const visibleColumns = useMemo(() => {
    const effectiveWidth = resolveEffectiveTableWidth(containerWidth, viewportWidth);
    return columns.filter((column) => !shouldHideForViewport(column.hideBelow, effectiveWidth));
  }, [columns, containerWidth, viewportWidth]);

  const effectiveTableWidth = resolveEffectiveTableWidth(containerWidth, viewportWidth);
  const useMobileLayout = effectiveTableWidth > 0 && effectiveTableWidth < BREAKPOINT_MIN_WIDTHS.sm;
  const minTableWidth = useMemo(
    () => computeMinTableWidth(visibleColumns, { selectable, hasActions }),
    [visibleColumns, selectable, hasActions],
  );
  const useScrollLayout =
    columnStretch === 'all' &&
    effectiveTableWidth > 0 &&
    minTableWidth > effectiveTableWidth &&
    !useMobileLayout;
  const resolvedColumnStretch = useScrollLayout ? 'none' : columnStretch;

  const structuralColumns = useMemo(() => {
    const builtColumns: Grid.Column<CrudGridSpec<T>>[] = [];

    if (selectable) {
      builtColumns.push({
        id: '__select__',
        name: '',
        width: 44,
        widthMin: 44,
        widthMax: 44,
        pin: 'start',
        movable: false,
        resizable: false,
        hide: false,
        headerRenderer: () => (
          <div
            className={cn(
              'flex h-full items-center justify-center',
              CRUD_TABLE_COLUMN_PADDING_SELECT,
            )}
          >
            <Checkbox
              className={TABLE_SELECTION_CHECKBOX_CLASS}
              checked={
                rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id))
                  ? true
                  : rowIds.some((id) => selectedIds.includes(id))
                    ? 'indeterminate'
                    : false
              }
              aria-label="Select all"
              onCheckedChange={() => setSelectedIds(toggleAllIds(rowIds, selectedIds))}
            />
          </div>
        ),
        cellRenderer: ({ row }) => {
          if (row.kind !== 'leaf' || !row.data) return null;
          const rowData = row.data;
          return (
            <div
              className={cn(
                'flex h-full items-center justify-center',
                CRUD_TABLE_COLUMN_PADDING_SELECT,
              )}
            >
              <Checkbox
                className={TABLE_SELECTION_CHECKBOX_CLASS}
                checked={selectedIds.includes(rowData.id)}
                aria-label="Select row"
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={() => setSelectedIds(toggleId(selectedIds, rowData.id))}
              />
            </div>
          );
        },
      });
    }

    visibleColumns.forEach((column, colIndex) => {
      const defaultWidth = parseCssSizeToPx(
        DEFAULT_WIDTH_BY_TYPE[column.type ?? 'text'],
        DEFAULT_RESIZE_MIN_WIDTH_PX,
      );
      const width = parseCssSizeToPx(column.width, defaultWidth);
      const widthMin = parseCssSizeToPx(column.minWidth, DEFAULT_RESIZE_MIN_WIDTH_PX);
      const widthMax = parseCssSizeToPx(column.maxWidth, DEFAULT_RESIZE_MAX_WIDTH_PX);
      const textAlign = resolveCrudColumnAlign(column);
      const isLastColumn = colIndex === visibleColumns.length - 1 && !hasActions;

      const widthFlex =
        resolvedColumnStretch === 'all'
          ? 1
          : resolvedColumnStretch === 'first' && colIndex === 0
            ? 1
            : undefined;

      builtColumns.push({
        id: column.key,
        name: column.header,
        field: column.key,
        width,
        widthMin,
        widthMax,
        widthFlex,
        resizable: true,
        movable: true,
        sort: sortValueForColumn(sortRef.current, column.key),
        headerRenderer: ({ column: gridColumn }) => {
          const sortable = Boolean(column.sortable);
          const currentSort = sortRef.current;
          return (
            <button
              type="button"
              aria-sort={getAriaSort(currentSort, gridColumn.id)}
              disabled={!sortable}
              className={cn(
                CRUD_TABLE_HEADER_INNER_BASE,
                crudTableColumnPaddingClass({
                  isFirstColumn: colIndex === 0,
                  isLastColumn,
                  align: textAlign,
                }),
                crudTableAlignClass(textAlign),
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                sortable
                  ? 'cursor-pointer text-foreground hover:text-foreground'
                  : 'cursor-default text-muted-foreground',
              )}
              onClick={() => {
                if (!sortable || !onSortChangeRef.current) return;
                onSortChangeRef.current(nextSortValue(sortRef.current, gridColumn.id));
              }}
            >
              <span className="truncate">{column.header}</span>
              {sortable ? <SortIcon sort={currentSort} columnKey={gridColumn.id} /> : null}
            </button>
          );
        },
        cellRenderer: ({ row }) => {
          if (row.kind !== 'leaf' || !row.data) {
            return <span className="text-muted-foreground">—</span>;
          }

          const content = renderTypedCell(row.data, column);
          const cellContent = shouldTruncateCell(column) ? (
            <TruncatedCell maxWidth={column.width ?? DEFAULT_TRUNCATE_MAX_REM}>
              {content}
            </TruncatedCell>
          ) : (
            content
          );

          return (
            <div
              className={cn(
                CRUD_TABLE_CELL_INNER_BASE,
                crudTableColumnPaddingClass({
                  isFirstColumn: colIndex === 0,
                  isLastColumn,
                  align: textAlign,
                }),
                crudTableAlignClass(textAlign),
                column.className,
                highlightedIdRef.current === row.data.id && 'font-medium',
              )}
            >
              {cellContent}
            </div>
          );
        },
      });
    });

    if (hasActions) {
      builtColumns.push({
        id: '__actions__',
        name: '',
        width: 56,
        widthMin: 56,
        widthMax: 56,
        pin: 'end',
        movable: false,
        resizable: false,
        headerRenderer: () => null,
        cellRenderer: ({ row }) => {
          if (row.kind !== 'leaf' || !row.data) return null;

          const item = row.data;
          const visibleActions = rowActionsRef.current.filter((action) => !action.hidden?.(item));
          if (visibleActions.length === 0) return null;
          const normalActions = visibleActions.filter((action) => !action.destructive);
          const destructiveActions = visibleActions.filter((action) => action.destructive);

          return (
            <div
              className={cn(
                'relative z-10 flex h-full items-center justify-center',
                CRUD_TABLE_COLUMN_PADDING_ACTIONS,
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7 bg-transparent text-muted-foreground opacity-0 transition-[opacity,colors]',
                      'hover:bg-muted/70 hover:text-foreground',
                      'group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
                      'data-[state=open]:bg-muted/70 data-[state=open]:text-foreground',
                    )}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreIcon className="h-4 w-4" weight="bold" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {normalActions.map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (action.confirm) {
                          setConfirmDialog({ mode: 'row', action, item });
                          return;
                        }
                        action.onClick(item);
                      }}
                    >
                      {action.icon ? <span className="mr-2">{action.icon}</span> : null}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  {normalActions.length > 0 && destructiveActions.length > 0 ? (
                    <DropdownMenuSeparator />
                  ) : null}
                  {destructiveActions.map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      className="text-destructive focus:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (action.confirm) {
                          setConfirmDialog({ mode: 'row', action, item });
                          return;
                        }
                        action.onClick(item);
                      }}
                    >
                      {action.icon ? <span className="mr-2">{action.icon}</span> : null}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      });
    }

    return builtColumns;
  }, [
    resolvedColumnStretch,
    hasActions,
    selectable,
    selectedIds,
    rowIds,
    setSelectedIds,
    visibleColumns,
  ]);

  const [userGridColumns, setUserGridColumns] = useState<Grid.Column<CrudGridSpec<T>>[] | null>(
    null,
  );

  const gridColumns = useMemo(
    () =>
      mergeGridColumns(
        userGridColumns ?? structuralColumns,
        structuralColumns,
        resolvedColumnStretch,
      ),
    [structuralColumns, userGridColumns, resolvedColumnStretch],
  );

  const resolvedColumnStateStorageKey = useMemo(() => {
    if (columnStateStorageKey) return columnStateStorageKey;
    if (typeof window === 'undefined') return undefined;
    const columnSignature = columns.map((column) => column.key).join('|');
    return `crud-table:${window.location.pathname}:${columnSignature}`;
  }, [columnStateStorageKey, columns]);

  useEffect(() => {
    if (!resolvedColumnStateStorageKey || typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(resolvedColumnStateStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedColumnState;
      if (parsed?.v !== 1 || !Array.isArray(parsed.columns)) return;
      setUserGridColumns((previous) =>
        applyPersistedColumns(
          previous ?? structuralColumns,
          parsed as PersistedColumnState,
          columnStretch,
        ),
      );
    } catch {
      // ignore malformed persisted state
    }
  }, [resolvedColumnStateStorageKey, structuralColumns, columnStretch]);

  useEffect(() => {
    if (!resolvedColumnStateStorageKey || typeof window === 'undefined') return;
    if (!userGridColumns || userGridColumns.length === 0) return;

    try {
      const serialized = JSON.stringify(toPersistedColumnState(userGridColumns, columnStretch));
      window.localStorage.setItem(resolvedColumnStateStorageKey, serialized);
    } catch {
      // ignore storage errors
    }
  }, [resolvedColumnStateStorageKey, userGridColumns, columnStretch]);

  const handleColumnsChange = useCallback(
    (nextColumns: Grid.Column<CrudGridSpec<T>>[]) => {
      if (columnStretch === 'all') {
        const baseById = new Map(structuralColumns.map((column) => [column.id, column]));
        setUserGridColumns(
          nextColumns.map((column) => {
            const base = baseById.get(column.id);
            if (!base) return column;
            return { ...base, hide: column.hide, pin: column.pin };
          }),
        );
        return;
      }
      setUserGridColumns(nextColumns);
    },
    [columnStretch, structuralColumns],
  );

  const rowSource = useClientDataSource<T>({
    data: rows,
    leafIdFn: LEAF_ID_FN,
  });

  const gridHeight = useMemo(() => {
    const rowHeight = crudTableRowHeightPx(compact);
    const target = rows.length * rowHeight + CRUD_TABLE_GRID_CHROME_EXTRA_PX;
    return Math.min(640, Math.max(220, target));
  }, [compact, rows.length]);

  const horizontalScrollMinWidth = useMemo(() => {
    if (resolvedColumnStretch !== 'none') return undefined;
    return gridColumns.reduce((sum, column) => {
      if (column.hide) return sum;
      const width =
        typeof column.width === 'number'
          ? column.width
          : typeof column.widthMin === 'number'
            ? column.widthMin
            : DEFAULT_RESIZE_MIN_WIDTH_PX;
      return sum + width;
    }, 0);
  }, [resolvedColumnStretch, gridColumns]);

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

  if (isLoading) {
    return (
      <LoadingStateWithColumns
        compact={compact}
        columns={visibleColumns}
        selectable={selectable}
        hasActions={hasActions}
      />
    );
  }

  if (rows.length === 0 && isFetching) {
    return (
      <LoadingStateWithColumns
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

  const gridReady = resolvedColumnStretch === 'none' || containerWidth > 0;
  const scrollMinWidth = useScrollLayout ? minTableWidth : horizontalScrollMinWidth;

  return (
    <div className="crud-table-host flex w-full max-w-full min-w-0 flex-col">
      <BulkActionBar
        selectedCount={selectedIds.length}
        actions={bulkActions}
        selectedIds={selectedIds}
        rowIds={rowIds}
        onClear={() => setSelectedIds([])}
        onToggleAll={() => setSelectedIds(toggleAllIds(rowIds, selectedIds))}
        invokeBulkAction={invokeBulkAction}
      />
      {useMobileLayout ? (
        <CrudTableMobileList
          rows={rows}
          columns={visibleColumns}
          selectable={selectable}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowActions={rowActions}
          onRowClick={onRowClick}
          highlightedId={highlightedId}
          compact={compact}
          onRowActionConfirm={(action, item) => setConfirmDialog({ mode: 'row', action, item })}
        />
      ) : (
        <div
          ref={gridContainerRef}
          className={cn(
            'relative w-full max-w-full min-w-0 bg-background',
            useScrollLayout && 'overflow-x-auto',
          )}
        >
          <div
            style={{
              height: gridHeight,
              width: scrollMinWidth ? `${scrollMinWidth}px` : '100%',
              minWidth: scrollMinWidth ? `${scrollMinWidth}px` : undefined,
            }}
          >
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
                columnSizeToFit={resolvedColumnStretch !== 'none'}
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

      <AlertDialog
        open={Boolean(confirmDialog)}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.mode === 'bulk' && confirmDialog.action.confirm
                ? typeof confirmDialog.action.confirm.title === 'function'
                  ? confirmDialog.action.confirm.title(confirmDialog.ids.length)
                  : confirmDialog.action.confirm.title
                : confirmDialog?.mode === 'row'
                  ? confirmDialog.action.confirm?.title
                  : null}
            </AlertDialogTitle>
            {confirmDialog?.mode === 'bulk' && confirmDialog.action.confirm?.description ? (
              <AlertDialogDescription>
                {confirmDialog.action.confirm.description}
              </AlertDialogDescription>
            ) : null}
            {confirmDialog?.mode === 'row' && confirmDialog.action.confirm?.description ? (
              <AlertDialogDescription>
                {confirmDialog.action.confirm.description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmDialog?.action.destructive ? 'destructive' : 'cta'}
              onClick={() => {
                if (!confirmDialog) return;
                if (confirmDialog.mode === 'row') {
                  confirmDialog.action.onClick(confirmDialog.item);
                } else {
                  confirmDialog.action.onClick(confirmDialog.ids);
                }
                setConfirmDialog(null);
              }}
            >
              {confirmDialog?.mode === 'bulk'
                ? (confirmDialog.action.confirm?.actionLabel ?? 'Delete')
                : confirmDialog?.mode === 'row'
                  ? (confirmDialog.action.confirm?.actionLabel ?? 'Confirm')
                  : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
