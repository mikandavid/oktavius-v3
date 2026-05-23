import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { contractColumns, contractsPageIcon } from './shared';

export function ContractsListPage() {
  const { contracts } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });
  const [sort, setSort] = useState('contractNumber');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = contracts.filter((c) => {
      const matchesSearch =
        !q ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q);
      const matchesStatus = !filters.status || c.status === filters.status;
      return matchesSearch && matchesStatus;
    });
    return sortRows(rows, sort);
  }, [contracts, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Contracts"
      subtitle="Legal agreements, renewals, and clause libraries."
      icon={contractsPageIcon()}
      search={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
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
      values={filters}
      onFilterChange={(key, value) => {
        setFilters((f) => ({ ...f, [key]: value }));
        setPage(1);
      }}
      onReset={() => {
        setSearch('');
        setFilters({ status: '' });
        setPage(1);
      }}
      rows={paged}
      columns={contractColumns}
      allRows={filtered}
      emptyTitle="No contracts found"
      entityLabel="contract"
      getRowHref={(c) => `/contracts/${c.id}`}
      sort={sort}
      onSortChange={(s) => {
        setSort(s);
        setPage(1);
      }}
      page={safePage}
      pageSize={pageSize}
      total={filtered.length}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}
