import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { CasesHeaderAction, caseColumns, caseFilters, casesPageIcon } from './shared';

export function CasesListPage() {
  const { cases } = useDemoData();
  const [rows, setRows] = useState(cases);

  useEffect(() => {
    setRows(cases);
  }, [cases]);

  const list = useListPageState({
    rows,
    defaultSort: 'caseNumber',
    filterKeys: ['type', 'stage', 'priority'],
    searchKeys: ['caseNumber', 'title', 'clientName', 'assignee', 'summary'],
  });

  return (
    <CrudMainView
      title="Cases"
      subtitle="Support, legal, and billing case management"
      icon={casesPageIcon()}
      headerActions={<CasesHeaderAction />}
      columns={caseColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search cases"
      filters={caseFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="case"
      getRowHref={(row) => `/cases/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'cases', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No cases found"
      emptyDescription="Open a new case or adjust your filters."
    />
  );
}
