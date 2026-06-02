import { useMemo } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

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
};

export function useListPageState<T extends Record<string, unknown>>({
  rows,
  defaultSort,
  pageSize = 10,
  filterKeys,
  initialFilters,
  searchKeys,
  filterFn,
}: UseListPageStateOptions<T>) {
  const filterParsers = useMemo(
    () =>
      Object.fromEntries(
        filterKeys.map((key) => [key, parseAsString.withDefault(initialFilters?.[key] ?? '')]),
      ),
    [filterKeys, initialFilters],
  );

  const parsers = useMemo(
    () => ({
      q: parseAsString.withDefault(''),
      sort: parseAsString.withDefault(defaultSort),
      page: parseAsInteger.withDefault(1),
      ...filterParsers,
    }),
    [defaultSort, filterParsers],
  );

  const [urlState, setUrlState] = useQueryStates(parsers, {
    history: 'replace',
    clearOnDefault: true,
  });

  const search = urlState.q;
  const sort = urlState.sort;
  const page = urlState.page;
  const filters = Object.fromEntries(
    filterKeys.map((key) => {
      const value = urlState[key as keyof typeof urlState];
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
      const matchesFilters = filterKeys.every(
        (key) => filters[key].length === 0 || String(row[key] ?? '') === filters[key],
      );
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
      void setUrlState({ q: value, page: 1 });
    },
    filters,
    values: filters,
    onFilterChange: (key: string, value: string) => {
      void setUrlState({ [key]: value, page: 1 });
    },
    onReset: () => {
      void setUrlState({
        q: '',
        sort: defaultSort,
        page: 1,
        ...Object.fromEntries(filterKeys.map((key) => [key, ''])),
      });
    },
    sort,
    onSortChange: (nextSort: string) => {
      void setUrlState({ sort: nextSort, page: 1 });
    },
    page: safePage,
    pageSize,
    total: filtered.length,
    totalPages,
    onPageChange: (nextPage: number) => {
      void setUrlState({ page: nextPage });
    },
    filtered,
    paged,
  };
}
