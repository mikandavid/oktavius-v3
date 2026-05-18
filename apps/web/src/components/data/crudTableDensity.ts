export const CRUD_TABLE_HEADER_HEIGHT_PX = 40;

export const CRUD_TABLE_ROW_HEIGHT_DEFAULT = 44;
export const CRUD_TABLE_ROW_HEIGHT_COMPACT = 38;

export const CRUD_TABLE_GRID_CHROME_EXTRA_PX = 42;

export function crudTableRowHeightPx(compact: boolean) {
  return compact ? CRUD_TABLE_ROW_HEIGHT_COMPACT : CRUD_TABLE_ROW_HEIGHT_DEFAULT;
}

export const CRUD_TABLE_HEADER_INNER_BASE =
  'flex h-full w-full items-center gap-1.5 px-2 text-left text-xs font-medium';

export const CRUD_TABLE_CELL_INNER_BASE = 'flex h-full min-w-0 items-center px-2 text-sm';
