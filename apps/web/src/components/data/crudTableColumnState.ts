import type { Grid } from '@1771technologies/lytenyte-core';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';

import type { CrudColumn } from './crudTableTypes';

export type CrudGridColumnState = {
  sort?: 'asc' | 'desc' | null;
};

export type CrudGridSpec<T> = Grid.GridSpec<T, CrudGridColumnState>;
export type CrudGridApi<T> = Grid.API<CrudGridSpec<T>>;

export type ColumnStretchMode = 'first' | 'all' | 'none';

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

/**
 * User column state (resize/reorder/hide/pin) merged over the structural
 * columns, persisted to localStorage keyed by route + column signature.
 */
export function useCrudColumnState<T>({
  structuralColumns,
  columnStretch,
  columnStateStorageKey,
  permittedColumns,
}: {
  structuralColumns: Grid.Column<CrudGridSpec<T>>[];
  columnStretch: ColumnStretchMode;
  columnStateStorageKey?: string;
  permittedColumns: CrudColumn<T>[];
}) {
  const [userGridColumns, setUserGridColumns] = useState<Grid.Column<CrudGridSpec<T>>[] | null>(
    null,
  );

  const gridColumns = useMemo(
    () => mergeGridColumns(userGridColumns ?? structuralColumns, structuralColumns, columnStretch),
    [structuralColumns, userGridColumns, columnStretch],
  );

  const resolvedColumnStateStorageKey = useMemo(() => {
    if (columnStateStorageKey) return columnStateStorageKey;
    if (typeof window === 'undefined') return undefined;
    const columnSignature = permittedColumns.map((column) => column.key).join('|');
    return `crud-table:${window.location.pathname}:${columnSignature}`;
  }, [columnStateStorageKey, permittedColumns]);

  useEffect(() => {
    if (!resolvedColumnStateStorageKey) return;
    const storage = getWindowStorage('localStorage');

    try {
      const raw = safeStorageGet(storage, resolvedColumnStateStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedColumnState;
      if (parsed?.v !== 1 || !Array.isArray(parsed.columns)) return;
      setUserGridColumns((previous) =>
        applyPersistedColumns(previous ?? structuralColumns, parsed, columnStretch),
      );
    } catch {
      // ignore malformed persisted state
    }
  }, [resolvedColumnStateStorageKey, structuralColumns, columnStretch]);

  useEffect(() => {
    if (!resolvedColumnStateStorageKey) return;
    if (!userGridColumns || userGridColumns.length === 0) return;

    try {
      const serialized = JSON.stringify(toPersistedColumnState(userGridColumns, columnStretch));
      safeStorageSet(getWindowStorage('localStorage'), resolvedColumnStateStorageKey, serialized);
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

  return { gridColumns, handleColumnsChange };
}
