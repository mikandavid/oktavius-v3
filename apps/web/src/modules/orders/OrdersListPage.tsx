import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';
import { useOrgNavPaths } from '@/lib/org-profiles/useOrgProfile';

import { ORDER_SAVED_VIEWS, orderColumns, orderFilters, ordersPageIcon } from './shared';

export function OrdersListPage() {
  const api = useApiRegistry();
  const { orders } = useDemoData();
  const nav = useOrgNavPaths();
  const loadOrders = useCallback(
    (params: StandardCrudListRequestParams) => api.orders.list(params),
    [api.orders],
  );

  return (
    <StandardCrudListPage
      title="Orders"
      subtitle="Sales orders and fulfillment"
      icon={ordersPageIcon()}
      rows={orders}
      loadRows={loadOrders}
      columns={orderColumns}
      filters={orderFilters}
      savedViews={ORDER_SAVED_VIEWS}
      defaultSort="orderDate"
      filterKeys={['status', 'owner', 'clientName']}
      searchKeys={['orderNumber', 'clientName', 'owner']}
      searchPlaceholder="Search orders"
      entityLabel="order"
      getRowHref={(row) => `${nav.orders}/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.orders.delete(id))).then(() => undefined)
      }
      exportFileName="orders"
      emptyTitle="No orders found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
