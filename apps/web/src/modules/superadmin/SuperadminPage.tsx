import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { OrganizationsHeaderAction, orgColumns, orgFilters, superadminPageIcon } from './shared';

export function SuperadminPage() {
  const { organizations } = useDemoData();
  const [rows, setRows] = useState(organizations);

  useEffect(() => {
    setRows(organizations);
  }, [organizations]);

  const list = useListPageState({
    rows,
    defaultSort: 'name',
    filterKeys: ['plan', 'status', 'environment'],
    searchKeys: ['name', 'slug', 'region', 'ownerName', 'billingEmail'],
  });

  return (
    <CrudMainView
      title="Superadmin"
      subtitle="Platform organizations and environments"
      icon={superadminPageIcon()}
      headerActions={<OrganizationsHeaderAction />}
      columns={orgColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search organizations"
      filters={orgFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="organization"
      getRowHref={(row) => `/superadmin/orgs/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'organizations', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No organizations found"
      emptyDescription="Create an organization or adjust your filters."
    />
  );
}
