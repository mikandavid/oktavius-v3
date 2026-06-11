import { useQuery } from '@tanstack/react-query';

import type { ListResponse } from '@/api/contracts';

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

export function buildStandardCrudListQueryKey({
  resourceKey,
  activeOrgId,
  activeSiteId,
  requestParams,
}: {
  resourceKey: string;
  activeOrgId: string | null | undefined;
  activeSiteId: string | null | undefined;
  requestParams: StandardCrudListRequestParams;
}) {
  return [
    'scope',
    activeOrgId ?? 'none',
    activeSiteId ?? 'none',
    'standard-crud-list',
    resourceKey,
    requestParams,
  ] as const;
}

export function useStandardCrudServerList<T>({
  enabled,
  loadRows,
  queryKey,
  requestParams,
}: {
  enabled: boolean;
  loadRows?: (params: StandardCrudListRequestParams) => Promise<ListResponse<T>>;
  queryKey: ReturnType<typeof buildStandardCrudListQueryKey>;
  requestParams: StandardCrudListRequestParams;
}) {
  return useQuery({
    queryKey,
    enabled,
    placeholderData: (previous) => previous,
    queryFn: () => {
      if (!loadRows) {
        throw new Error('Standard CRUD list query is enabled without a loadRows handler.');
      }

      return loadRows(requestParams);
    },
  });
}
