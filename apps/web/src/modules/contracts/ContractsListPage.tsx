import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { contractColumns, contractsPageIcon } from './shared';

export function ContractsListPage() {
  const { contracts } = useDemoData();

  const list = useListPageState({
    rows: contracts,
    defaultSort: 'contractNumber',
    pageSize: 10,
    filterKeys: ['status'],
    filterFn: (contract, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        contract.contractNumber.toLowerCase().includes(q) ||
        contract.title.toLowerCase().includes(q) ||
        contract.clientName.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || contract.status === filters.status;
      return matchesSearch && matchesStatus;
    },
  });

  return (
    <CrudMainView
      title="Contracts"
      subtitle="Legal agreements, renewals, and clause libraries."
      icon={contractsPageIcon()}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search contract, client…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Draft', label: 'Draft' },
            { value: 'Active', label: 'Active' },
            { value: 'Expiring', label: 'Expiring' },
            { value: 'Terminated', label: 'Terminated' },
          ],
        },
      ]}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={contractColumns}
      allRows={list.filtered}
      emptyTitle="No contracts found"
      entityLabel="contract"
      getRowHref={(c) => `/contracts/${c.id}`}
      sort={list.sort}
      onSortChange={list.onSortChange}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
    />
  );
}
