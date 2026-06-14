export const CRUD_TABLE_HEADER_HEIGHT_PX = 40;

export const CRUD_TABLE_ROW_HEIGHT_DEFAULT = 44;
export const CRUD_TABLE_ROW_HEIGHT_COMPACT = 38;

export const CRUD_TABLE_GRID_CHROME_EXTRA_PX = 42;

export function crudTableRowHeightPx(compact: boolean) {
  return compact ? CRUD_TABLE_ROW_HEIGHT_COMPACT : CRUD_TABLE_ROW_HEIGHT_DEFAULT;
}

export const CRUD_TABLE_SELECTION_CHECKBOX_CLASS =
  'border-border/80 data-[state=checked]:border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground data-[state=indeterminate]:border-sidebar-primary data-[state=indeterminate]:bg-sidebar-primary/80 data-[state=indeterminate]:text-sidebar-primary-foreground';

/** Pinned selection column width — keep in sync with `buildSelectColumn`. */
export const CRUD_TABLE_SELECT_COLUMN_WIDTH_PX = 44;
export const CRUD_TABLE_SELECT_COLUMN_WIDTH_CLASS = 'w-11';

/** Inner wrapper for a selection cell inside a grid row/column. */
export function crudTableSelectCellInnerClass(className?: string) {
  return `flex items-center justify-center ${CRUD_TABLE_COLUMN_PADDING_SELECT}${className ? ` ${className}` : ''}`;
}

/** Fixed-width selection slot for toolbars (e.g. bulk action bar). */
export function crudTableSelectColumnSlotClass(className?: string) {
  return `${CRUD_TABLE_SELECT_COLUMN_WIDTH_CLASS} flex shrink-0 items-center justify-center ${CRUD_TABLE_COLUMN_PADDING_SELECT}${className ? ` ${className}` : ''}`;
}

export const CRUD_TABLE_HEADER_INNER_BASE =
  'flex h-full w-full items-center gap-1.5 text-xs font-medium';

export const CRUD_TABLE_CELL_INNER_BASE = 'flex h-full min-w-0 items-center text-sm';

/** Pinned selection column at grid start. */
export const CRUD_TABLE_COLUMN_PADDING_SELECT = 'pl-4 pr-2';

/** Pinned actions column at grid end. */
export const CRUD_TABLE_COLUMN_PADDING_ACTIONS = 'pl-2 pr-5';

export function crudTableColumnPaddingClass(options: {
  isFirstColumn?: boolean;
  isLastColumn?: boolean;
  align?: 'left' | 'right';
}): string {
  const pl = options.isFirstColumn ? 'pl-5' : options.align === 'right' ? 'pl-3' : 'pl-4';
  const pr = options.isLastColumn ? 'pr-5' : options.align === 'right' ? 'pr-4' : 'pr-4';
  return `${pl} ${pr}`;
}

/** Table alignment: text/status/dates left; only currency and explicit `align: 'right'` on numbers. */
export function crudTableAlignClass(align: 'left' | 'right') {
  return align === 'right' ? 'justify-end text-right' : 'justify-start text-left';
}

export function resolveCrudColumnAlign(column: {
  align?: 'left' | 'center' | 'right';
  type?: string;
}): 'left' | 'right' {
  if (column.align === 'right') return 'right';
  if (column.align === 'left') return 'left';
  if (column.type === 'currency') return 'right';
  return 'left';
}
