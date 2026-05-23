import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { orderColumns, ordersPageIcon } from './shared';

export function OrdersListPage() {
  const { orders } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' });
  const [sort, setSort] = useState('-orderDate');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.owner.toLowerCase().includes(q);
      const matchesStatus = !filters.status || o.status === filters.status;
      return matchesSearch && matchesStatus;
    });
    return sortRows(rows, sort);
  }, [orders, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Sales orders"
      subtitle="Track quotes, confirmations, fulfillment, and delivery."
      icon={ordersPageIcon()}
      search={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
      searchPlaceholder="Search order, client, owner…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Draft', label: 'Draft' },
            { value: 'Confirmed', label: 'Confirmed' },
            { value: 'Shipped', label: 'Shipped' },
            { value: 'Delivered', label: 'Delivered' },
            { value: 'Cancelled', label: 'Cancelled' },
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
      columns={orderColumns}
      allRows={filtered}
      exportOptions={{ fileName: 'orders', label: 'Export' }}
      emptyTitle="No orders found"
      emptyDescription="Adjust filters or create a new sales order."
      entityLabel="order"
      getRowHref={(o) => `/orders/${o.id}`}
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
