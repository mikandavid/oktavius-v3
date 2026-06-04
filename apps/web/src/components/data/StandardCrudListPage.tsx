import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ListResponse } from '@/api/demo-client';
import { createConfiguredSavedViewsStore } from '@/api/apiStoreConfig';
import { useDemoData } from '@/app/demo-data';
import { canDeleteRecords, permissionSubjectFor } from '@/lib/permissions';
import { useListPageState } from '@/lib/useListPageState';

import { CrudMainView, type CrudColumn } from './CrudMainView';
import type { BulkAction, CrudRowAction } from './CrudTable';
import type { FilterDef } from './FilterToolbar';
import type { SavedViewsStore } from './savedViewsStorage';
import { useListSavedViews, type SavedViewPreset } from './useListSavedViews';
import { getWindowStorage } from '@/lib/storage/safeStorage';

type StandardCrudListPageProps<T extends { id: string } & Record<string, unknown>> = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  headerActions?: ReactNode;
  rows: T[];
  loadRows?: (params: StandardCrudListRequestParams) => Promise<ListResponse<T>>;
  columns: CrudColumn<T>[];
  filters: FilterDef[];
  savedViews?: SavedViewPreset[];
  savedViewsStore?: SavedViewsStore;
  rowActions?: CrudRowAction<T>[];
  bulkActions?: BulkAction[];
  defaultSort: string;
  filterKeys: string[];
  searchKeys: string[];
  searchPlaceholder: string;
  entityLabel: string;
  getRowHref: (row: T) => string;
  onDeleteRows?: (ids: string[]) => void | Promise<void>;
  exportFileName: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type StandardCrudListRequestParams = {
  page: string;
  pageSize: string;
  sort: string;
  search: string;
} & Record<string, string>;

export function buildStandardCrudListRequestParams({
  page,
  pageSize,
  sort,
  search,
  values,
}: {
  page: number;
  pageSize: number;
  sort: string;
  search: string;
  values: Record<string, string>;
}): StandardCrudListRequestParams {
  return {
    page: String(page),
    pageSize: String(pageSize),
    sort,
    search,
    ...values,
  };
}

export function StandardCrudListPage<T extends { id: string } & Record<string, unknown>>({
  title,
  subtitle,
  icon,
  headerActions,
  rows,
  loadRows,
  columns,
  filters,
  savedViews = [],
  savedViewsStore,
  rowActions,
  bulkActions,
  defaultSort,
  filterKeys,
  searchKeys,
  searchPlaceholder,
  entityLabel,
  getRowHref,
  onDeleteRows,
  exportFileName,
  emptyTitle,
  emptyDescription,
}: StandardCrudListPageProps<T>) {
  const { activeMembership, currentUser } = useDemoData();
  const permissionSubject = useMemo(
    () => permissionSubjectFor(currentUser, activeMembership),
    [activeMembership, currentUser],
  );
  const allowDeleteRows = canDeleteRecords(permissionSubject);
  const list = useListPageState({
    rows,
    defaultSort,
    filterKeys,
    searchKeys,
  });
  const [serverList, setServerList] = useState<ListResponse<T> | null>(null);
  const [isLoadingServerList, setIsLoadingServerList] = useState(false);
  const valuesKey = JSON.stringify(list.values);
  const storage = getWindowStorage('localStorage');
  const defaultSavedViewsStore = useMemo(
    () =>
      createConfiguredSavedViewsStore({
        listKey: exportFileName,
        storage,
        env: import.meta.env,
      }),
    [exportFileName, storage],
  );

  const requestParams = useMemo(
    () =>
      buildStandardCrudListRequestParams({
        page: list.page,
        pageSize: list.pageSize,
        sort: list.sort,
        search: list.search,
        values: list.values,
      }),
    // `list.values` is intentionally represented by a stable JSON key here so
    // server-backed lists do not refetch on unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list.page, list.pageSize, list.sort, list.search, valuesKey],
  );

  useEffect(() => {
    if (!loadRows) {
      setServerList(null);
      setIsLoadingServerList(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingServerList(true);
    void loadRows(requestParams)
      .then((response) => {
        if (!cancelled) {
          setServerList(response);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingServerList(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadRows, requestParams]);

  const savedViewControls = useListSavedViews({
    views: savedViews,
    listKey: exportFileName,
    filterKeys,
    values: list.values,
    onFilterChange: list.onFilterChange,
    onReset: list.onReset,
    store: savedViews.length > 0 ? (savedViewsStore ?? defaultSavedViewsStore) : savedViewsStore,
  });

  return (
    <CrudMainView
      title={title}
      subtitle={subtitle}
      icon={icon}
      headerActions={headerActions}
      toolbarTrailing={savedViews.length > 0 ? savedViewControls.toolbarTrailing : undefined}
      columns={columns}
      rows={serverList?.data ?? list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rowActions={rowActions}
      bulkActions={bulkActions}
      isLoading={isLoadingServerList && !serverList}
      isFetching={isLoadingServerList && Boolean(serverList)}
      page={serverList?.page ?? list.page}
      pageSize={serverList?.pageSize ?? list.pageSize}
      total={serverList?.total ?? list.total}
      totalPages={serverList?.totalPages ?? list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel={entityLabel}
      getRowHref={getRowHref}
      allowDeleteRows={allowDeleteRows}
      onDeleteRows={onDeleteRows}
      exportOptions={{ fileName: exportFileName, label: 'Export' }}
      allRows={list.filtered}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}
