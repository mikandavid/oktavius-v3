import { useMemo } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import type { ClientRecord } from '@/app/demo-data';
import { useClientsList } from './clients-api';
import { clientColumns, clientsPageIcon, ClientsHeaderAction } from './shared';

export function ClientsListPage() {
  const list = useListPageState<ClientRecord>({
    rows: [],
    defaultSort: 'name',
    pageSize: 10,
    filterKeys: ['status', 'type'],
  });

  const listParams = useMemo(
    () => ({
      page: String(list.page),
      pageSize: String(list.pageSize),
      sort: list.sort,
      search: list.search,
      status: list.filters.status,
      type: list.filters.type,
    }),
    [list.page, list.pageSize, list.sort, list.search, list.filters.status, list.filters.type],
  );

  const { data, isLoading, isFetching } = useClientsList(listParams);
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <CrudMainView
      title="Clients"
      subtitle="Manage client accounts, contracts, and relationships."
      icon={clientsPageIcon()}
      headerActions={<ClientsHeaderAction />}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search by name, email, industry…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Active', label: 'Active' },
            { value: 'Prospect', label: 'Prospect' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Churned', label: 'Churned' },
          ],
        },
        {
          key: 'type',
          label: 'Type',
          options: [
            { value: 'Company', label: 'Company' },
            { value: 'Individual', label: 'Individual' },
          ],
        },
      ]}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={rows}
      columns={clientColumns}
      allRows={rows}
      exportOptions={{ fileName: 'clients', label: 'Export' }}
      emptyTitle="No clients found"
      emptyDescription="Try adjusting filters or create a new client."
      entityLabel="client"
      getRowHref={(c) => `/clients/${c.id}`}
      sort={list.sort}
      onSortChange={list.onSortChange}
      page={list.page}
      pageSize={list.pageSize}
      total={total}
      totalPages={totalPages}
      onPageChange={list.onPageChange}
      isLoading={isLoading || isFetching}
    />
  );
}
