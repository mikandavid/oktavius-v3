import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { invoiceColumns, invoicesPageIcon } from './shared';

export function InvoicesListPage() {
  const { invoices } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });
  const [sort, setSort] = useState('-issuedAt');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q);
      const matchesStatus = !filters.status || inv.status === filters.status;
      return matchesSearch && matchesStatus;
    });
    return sortRows(rows, sort);
  }, [invoices, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Invoices"
      subtitle="Billing documents linked to sales orders and clients."
      icon={invoicesPageIcon()}
      search={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      searchPlaceholder="Search invoice, client, order…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Draft', label: 'Draft' },
            { value: 'Sent', label: 'Sent' },
            { value: 'Paid', label: 'Paid' },
            { value: 'Overdue', label: 'Overdue' },
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
      columns={invoiceColumns}
      allRows={filtered}
      exportOptions={{ fileName: 'invoices', label: 'Export' }}
      emptyTitle="No invoices found"
      entityLabel="invoice"
      getRowHref={(inv) => `/invoices/${inv.id}`}
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
