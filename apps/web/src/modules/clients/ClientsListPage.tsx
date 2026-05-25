import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useListSavedViews } from '@/components/data/useListSavedViews';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import {
  CLIENT_SAVED_VIEWS,
  ClientsListHeaderActions,
  clientColumns,
  clientFilters,
  clientsPageIcon,
} from './shared';

export function ClientsListPage() {
  const { clients } = useDemoData();
  const [rows, setRows] = useState(clients);

  useEffect(() => {
    setRows(clients);
  }, [clients]);

  const list = useListPageState({
    rows,
    defaultSort: 'name',
    filterKeys: ['status', 'type'],
    searchKeys: ['name', 'email', 'industry', 'city', 'accountManager'],
  });

  const { toolbarTrailing } = useListSavedViews({
    views: CLIENT_SAVED_VIEWS,
    filterKeys: ['status', 'type'],
    onFilterChange: list.onFilterChange,
    onReset: list.onReset,
  });

  return (
    <CrudMainView
      title="Clients"
      subtitle="Customer accounts and relationships"
      icon={clientsPageIcon()}
      headerActions={<ClientsListHeaderActions />}
      toolbarTrailing={toolbarTrailing}
      columns={clientColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search clients"
      filters={clientFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="client"
      getRowHref={(row) => `/clients/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'clients', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No clients found"
      emptyDescription="Create a client or adjust your filters."
    />
  );
}
