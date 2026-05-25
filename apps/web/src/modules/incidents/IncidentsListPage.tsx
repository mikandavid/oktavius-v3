import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { incidentColumns, incidentFilters, incidentsPageIcon } from './shared';

export function IncidentsListPage() {
  const { incidents } = useDemoData();
  const [rows, setRows] = useState(incidents);

  useEffect(() => {
    setRows(incidents);
  }, [incidents]);

  const list = useListPageState({
    rows,
    defaultSort: 'reportedAt',
    filterKeys: ['severity', 'status', 'service'],
    searchKeys: ['incidentNumber', 'title', 'service', 'assignee', 'impact'],
  });

  return (
    <CrudMainView
      title="Incidents"
      subtitle="Operational incidents and service disruptions"
      icon={incidentsPageIcon()}
      columns={incidentColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search incidents"
      filters={incidentFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="incident"
      getRowHref={(row) => `/incidents/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'incidents', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No incidents found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
