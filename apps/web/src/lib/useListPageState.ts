import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { sortRows } from '@/lib/sortRows';

export type ListPageFilterContext = {
  search: string;
  filters: Record<string, string>;
};

export type UseListPageStateOptions<T extends Record<string, unknown>> = {
  rows: T[];
  defaultSort: string;
  pageSize?: number;
  /** Filter combobox keys — empty string means "all" */
  filterKeys: string[];
  initialFilters?: Record<string, string>;
  /** Simple search across these row keys when `filterFn` is omitted */
  searchKeys?: string[];
  /** Custom match logic — overrides default searchKeys + equality filters */
  filterFn?: (row: T, ctx: ListPageFilterContext) => boolean;
  /** Optional namespace for query keys. Defaults to current route prefix. */
  queryNamespace?: string;
};

export function useListPageState<T extends Record<string, unknown>>({
  rows,
  defaultSort,
  pageSize = 10,
  filterKeys,
  initialFilters,
  searchKeys,
  filterFn,
  queryNamespace,
}: UseListPageStateOptions<T>) {
  const { pathname } = useLocation();
  const namespace = useMemo(
    () => queryNamespace ?? pathname.split('/').filter(Boolean)[0] ?? 'global',
    [pathname, queryNamespace],
  );

  const qKey = `${namespace}:q`;
  const sortKey = `${namespace}:sort`;
  const pageKey = `${namespace}:page`;
  const toQueryKey = useCallback((key: string) => `${namespace}:${key}`, [namespace]);

  const filterParsers = useMemo(
    () =>
      Object.fromEntries(
        filterKeys.map((key) => [
          toQueryKey(key),
          parseAsString.withDefault(initialFilters?.[key] ?? ''),
        ]),
      ),
    [filterKeys, initialFilters, toQueryKey],
  );

  const parsers = useMemo(
    () => ({
      [qKey]: parseAsString.withDefault(''),
      [sortKey]: parseAsString.withDefault(defaultSort),
      [pageKey]: parseAsInteger.withDefault(1),
      ...filterParsers,
    }),
    [defaultSort, filterParsers, qKey, sortKey, pageKey],
  );

  const [urlState, setUrlState] = useQueryStates(parsers, {
    history: 'replace',
    clearOnDefault: true,
  });

  const search = typeof urlState[qKey] === 'string' ? (urlState[qKey] as string) : '';
  const sort = typeof urlState[sortKey] === 'string' ? (urlState[sortKey] as string) : defaultSort;
  const page = typeof urlState[pageKey] === 'number' ? (urlState[pageKey] as number) : 1;
  const filters = Object.fromEntries(
    filterKeys.map((key) => {
      const value = urlState[toQueryKey(key) as keyof typeof urlState];
      return [key, typeof value === 'string' ? value : ''];
    }),
  );

  const filtered = useMemo(() => {
    const matches = (row: T) => {
      if (filterFn) {
        return filterFn(row, { search, filters });
      }

      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        (searchKeys ?? []).some((key) =>
          String(row[key] ?? '')
            .toLowerCase()
            .includes(q),
        );
      const matchesFilters = filterKeys.every((key) => {
        const filterValue = filters[key] ?? '';
        return filterValue.length === 0 || String(row[key] ?? '') === filterValue;
      });
      return matchesSearch && matchesFilters;
    };

    return sortRows(rows.filter(matches), sort);
  }, [rows, search, filters, sort, filterFn, searchKeys, filterKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    search,
    onSearchChange: (value: string) => {
      void setUrlState({ [qKey]: value, [pageKey]: 1 });
    },
    filters,
    values: filters,
    onFilterChange: (key: string, value: string) => {
      void setUrlState({ [toQueryKey(key)]: value, [pageKey]: 1 });
    },
    onReset: () => {
      void setUrlState({
        [qKey]: '',
        [sortKey]: defaultSort,
        [pageKey]: 1,
        ...Object.fromEntries(filterKeys.map((key) => [toQueryKey(key), ''])),
      });
    },
    sort,
    onSortChange: (nextSort: string) => {
      void setUrlState({ [sortKey]: nextSort, [pageKey]: 1 });
    },
    requestedPage: page,
    page: safePage,
    pageSize,
    total: filtered.length,
    totalPages,
    onPageChange: (nextPage: number) => {
      void setUrlState({ [pageKey]: nextPage });
    },
    filtered,
    paged,
  };
}
