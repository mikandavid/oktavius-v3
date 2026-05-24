import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { orderColumns, ordersPageIcon } from './shared';

export function OrdersListPage() {
  const { orders } = useDemoData();

  const list = useListPageState({
    rows: orders,
    defaultSort: '-orderDate',
    pageSize: 10,
    filterKeys: ['status'],
    filterFn: (order, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.clientName.toLowerCase().includes(q) ||
        order.owner.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || order.status === filters.status;
      return matchesSearch && matchesStatus;
    },
  });

  return (
    <CrudMainView
      title="Sales orders"
      subtitle="Track quotes, confirmations, fulfillment, and delivery."
      icon={ordersPageIcon()}
      search={list.search}
      onSearchChange={list.onSearchChange}
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
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={orderColumns}
      allRows={list.filtered}
      exportOptions={{ fileName: 'orders', label: 'Export' }}
      emptyTitle="No orders found"
      emptyDescription="Adjust filters or create a new sales order."
      entityLabel="order"
      getRowHref={(o) => `/orders/${o.id}`}
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
