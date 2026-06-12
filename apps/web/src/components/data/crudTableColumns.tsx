import type { Grid } from '@1771technologies/lytenyte-core';
import type { MutableRefObject } from 'react';

import { MoreIcon, SortAscIcon, SortDescIcon, SortIcon as SortUnsortedIcon } from '@/lib/icons';

import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@oktavius/base-ui';

import {
  CRUD_TABLE_CELL_INNER_BASE,
  CRUD_TABLE_COLUMN_PADDING_ACTIONS,
  CRUD_TABLE_COLUMN_PADDING_SELECT,
  CRUD_TABLE_HEADER_INNER_BASE,
  CRUD_TABLE_SELECTION_CHECKBOX_CLASS,
  crudTableAlignClass,
  crudTableColumnPaddingClass,
  resolveCrudColumnAlign,
} from './crudTableDensity';
import {
  nextSortValue,
  parseCssSizeToPx,
  sortValueForColumn,
  toggleAllIds,
  toggleId,
} from './gridUtils';
import { renderTypedCell, shouldTruncateCell } from './crudTableCells';
import type { ColumnStretchMode, CrudGridSpec } from './crudTableColumnState';
import type { ColumnType, CrudColumn, CrudRowAction } from './crudTableTypes';

const DEFAULT_RESIZE_MIN_WIDTH_PX = 56;
const STRETCH_FLOOR_MIN_WIDTH_PX = 48;
const DEFAULT_RESIZE_MAX_WIDTH_PX = 1200;
const DEFAULT_TRUNCATE_MAX_REM = '36rem';

const DEFAULT_WIDTH_BY_TYPE: Record<ColumnType, string> = {
  text: '10rem',
  status: '7rem',
  date: '8rem',
  currency: '8rem',
  boolean: '4rem',
  badge: '7rem',
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

function getAriaSort(sort: string | undefined, key: string): 'ascending' | 'descending' | 'none' {
  if (sort === key) return 'ascending';
  if (sort === `-${key}`) return 'descending';
  return 'none';
}

export function buildSelectColumn<T extends { id: string }>({
  rowIds,
  selectedIds,
  setSelectedIds,
}: {
  rowIds: string[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}): Grid.Column<CrudGridSpec<T>> {
  return {
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
        className={cn('flex h-full items-center justify-center', CRUD_TABLE_COLUMN_PADDING_SELECT)}
      >
        <Checkbox
          className={CRUD_TABLE_SELECTION_CHECKBOX_CLASS}
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
            className={CRUD_TABLE_SELECTION_CHECKBOX_CLASS}
            checked={selectedIds.includes(rowData.id)}
            aria-label="Select row"
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={() => setSelectedIds(toggleId(selectedIds, rowData.id))}
          />
        </div>
      );
    },
  };
}

export function buildDataColumns<T extends { id: string }>({
  visibleColumns,
  hasActions,
  columnStretch,
  sortRef,
  onSortChangeRef,
  highlightedIdRef,
}: {
  visibleColumns: CrudColumn<T>[];
  hasActions: boolean;
  columnStretch: ColumnStretchMode;
  sortRef: MutableRefObject<string | undefined>;
  onSortChangeRef: MutableRefObject<((sort: string) => void) | undefined>;
  highlightedIdRef: MutableRefObject<string | undefined>;
}): Grid.Column<CrudGridSpec<T>>[] {
  return visibleColumns.map((column, colIndex) => {
    const defaultWidth = parseCssSizeToPx(
      DEFAULT_WIDTH_BY_TYPE[column.type ?? 'text'],
      DEFAULT_RESIZE_MIN_WIDTH_PX,
    );
    const width = parseCssSizeToPx(column.width, defaultWidth);
    const widthMin =
      columnStretch === 'all'
        ? STRETCH_FLOOR_MIN_WIDTH_PX
        : parseCssSizeToPx(column.minWidth, DEFAULT_RESIZE_MIN_WIDTH_PX);
    const widthMax = parseCssSizeToPx(column.maxWidth, DEFAULT_RESIZE_MAX_WIDTH_PX);
    const textAlign = resolveCrudColumnAlign(column);
    const isLastColumn = colIndex === visibleColumns.length - 1 && !hasActions;

    const widthFlex =
      columnStretch === 'all' ? 1 : columnStretch === 'first' && colIndex === 0 ? 1 : undefined;

    return {
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
    };
  });
}

export function buildActionsColumn<T extends { id: string }>({
  rowActionsRef,
  invokeRowAction,
}: {
  rowActionsRef: MutableRefObject<CrudRowAction<T>[]>;
  invokeRowAction: (action: CrudRowAction<T>, item: T) => void;
}): Grid.Column<CrudGridSpec<T>> {
  return {
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
                    invokeRowAction(action, item);
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
                    invokeRowAction(action, item);
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
  };
}
