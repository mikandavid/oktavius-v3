import { useMemo, useState } from 'react';

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

function emptyFilters(filterKeys: string[], initial?: Record<string, string>) {
  const next: Record<string, string> = {};
  for (const key of filterKeys) {
    next[key] = initial?.[key] ?? '';
  }
  return next;
}

export function useListPageState<T extends Record<string, unknown>>({
  rows,
  defaultSort,
  pageSize = 10,
  filterKeys,
  initialFilters,
  searchKeys,
  filterFn,
}: UseListPageStateOptions<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(defaultSort);
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    emptyFilters(filterKeys, initialFilters),
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

  const resetPage = () => setPage(1);

  return {
    search,
    onSearchChange: (value: string) => {
      setSearch(value);
      resetPage();
    },
    filters,
    values: filters,
    onFilterChange: (key: string, value: string) => {
      setFilters((current) => ({ ...current, [key]: value }));
      resetPage();
    },
    onReset: () => {
      setSearch('');
      setFilters(emptyFilters(filterKeys, initialFilters));
      resetPage();
    },
    sort,
    onSortChange: (nextSort: string) => {
      setSort(nextSort);
      resetPage();
    },
    page: safePage,
    pageSize,
    total: filtered.length,
    totalPages,
    onPageChange: setPage,
    filtered,
    paged,
  };
}
