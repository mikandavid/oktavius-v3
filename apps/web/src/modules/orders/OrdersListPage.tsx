import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { orderColumns, orderFilters, ordersPageIcon } from './shared';

export function OrdersListPage() {
  const { orders } = useDemoData();
  const [rows, setRows] = useState(orders);

  useEffect(() => {
    setRows(orders);
  }, [orders]);

  const list = useListPageState({
    rows,
    defaultSort: 'orderDate',
    filterKeys: ['status', 'owner', 'clientName'],
    searchKeys: ['orderNumber', 'clientName', 'owner'],
  });

  return (
    <CrudMainView
      title="Orders"
      subtitle="Sales orders and fulfillment"
      icon={ordersPageIcon()}
      columns={orderColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search orders"
      filters={orderFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="order"
      getRowHref={(row) => `/orders/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'orders', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No orders found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
