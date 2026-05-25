import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { contractColumns, contractFilters, contractsPageIcon } from './shared';

export function ContractsListPage() {
  const { contracts } = useDemoData();
  const [rows, setRows] = useState(contracts);

  useEffect(() => {
    setRows(contracts);
  }, [contracts]);

  const list = useListPageState({
    rows,
    defaultSort: 'contractNumber',
    filterKeys: ['status', 'clientName', 'owner'],
    searchKeys: ['contractNumber', 'title', 'clientName', 'owner'],
  });

  return (
    <CrudMainView
      title="Contracts"
      subtitle="Agreements, renewals, and commercial terms"
      icon={contractsPageIcon()}
      columns={contractColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search contracts"
      filters={contractFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="contract"
      getRowHref={(row) => `/contracts/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'contracts', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No contracts found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
