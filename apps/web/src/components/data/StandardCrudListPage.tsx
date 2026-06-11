import { useMemo, type ReactNode } from 'react';

import type { ListResponse } from '@/api/contracts';
import { createConfiguredSavedViewsStore } from '@/api/apiStoreConfig';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import { canDeleteRecords, EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import { getWindowStorage } from '@/lib/storage/safeStorage';
import { useListPageState } from '@/lib/useListPageState';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { CrudMainView, type CrudColumn } from './CrudMainView';
import type { BulkAction, CrudRowAction } from './CrudTable';
import type { FilterDef } from './FilterToolbar';
import type { SavedViewsStore } from './savedViewsStorage';
import {
  buildStandardCrudListQueryKey,
  buildStandardCrudListRequestParams,
  useStandardCrudServerList,
  type StandardCrudListRequestParams,
} from './standardCrudQuery';
import { useListSavedViews, type SavedViewPreset } from './useListSavedViews';

export type { StandardCrudListRequestParams } from './standardCrudQuery';

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
  const osirisRuntime = useOptionalOsirisRuntime();
  const { activeLocationId } = useActiveLocation();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );
  const allowDeleteRows = canDeleteRecords(permissionSubject);
  const list = useListPageState({
    rows,
    defaultSort,
    filterKeys,
    searchKeys,
  });
  const hasServerLoader = Boolean(loadRows);
  const requestedPage = hasServerLoader ? list.requestedPage : list.page;
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
        page: requestedPage,
        pageSize: list.pageSize,
        sort: list.sort,
        search: list.search,
        values: list.values,
      }),
    // `list.values` is intentionally represented by a stable JSON key here so
    // server-backed lists do not refetch on unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestedPage, list.pageSize, list.sort, list.search, valuesKey],
  );

  const serverListQuery = useStandardCrudServerList<T>({
    enabled: hasServerLoader,
    loadRows,
    queryKey: buildStandardCrudListQueryKey({
      resourceKey: exportFileName,
      activeOrgId: osirisRuntime?.activeOrgId ?? null,
      activeSiteId: activeLocationId,
      requestParams,
    }),
    requestParams,
  });
  const serverList = hasServerLoader ? (serverListQuery.data ?? null) : null;
  const isLoadingServerList = serverListQuery.isLoading;
  const isFetchingServerList = serverListQuery.isFetching;
  const shouldUseConfiguredSavedViewsStore =
    !savedViewsStore && !osirisRuntime?.savedViewsRuntime && savedViews.length > 0;
  const resolvedSavedViewsStore =
    savedViewsStore ?? (shouldUseConfiguredSavedViewsStore ? defaultSavedViewsStore : undefined);

  const savedViewControls = useListSavedViews({
    views: savedViews,
    listKey: exportFileName,
    filterKeys,
    values: list.values,
    onFilterChange: list.onFilterChange,
    onReset: list.onReset,
    store: resolvedSavedViewsStore,
    runtime: osirisRuntime?.savedViewsRuntime,
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
      isFetching={isFetchingServerList && Boolean(serverList)}
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
      allRows={hasServerLoader ? serverList?.data : list.filtered}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}
