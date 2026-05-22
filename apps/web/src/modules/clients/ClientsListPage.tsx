import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { clientColumns, ClientsHeaderAction } from './shared';

export function ClientsListPage() {
  const { clients } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '', type: '' });
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = clients.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.accountManager.toLowerCase().includes(q);
      const matchesStatus = !filters.status || c.status === filters.status;
      const matchesType = !filters.type || c.type === filters.type;
      return matchesSearch && matchesStatus && matchesType;
    });

    return sortRows(rows, sort);
  }, [clients, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Clients"
      subtitle="Manage client accounts, contracts, and relationships."
      headerActions={<ClientsHeaderAction />}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
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
      values={filters}
      onFilterChange={(key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); }}
      onReset={() => { setSearch(''); setFilters({ status: '', type: '' }); setPage(1); }}
      rows={paged}
      columns={clientColumns}
      allRows={filtered}
      exportOptions={{ fileName: 'clients', label: 'Export' }}
      emptyTitle="No clients found"
      emptyDescription="Try adjusting filters or create a new client."
      getRowHref={(c) => `/clients/${c.id}`}
      sort={sort}
      onSortChange={(s) => { setSort(s); setPage(1); }}
      page={safePage}
      pageSize={pageSize}
      total={filtered.length}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}
