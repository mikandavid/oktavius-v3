import type { OrderRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import { StatusBadge } from '@/components/feedback/StatusBadge';

const ORDER_STATUS_MAP = {
  Draft: 'warning',
  Confirmed: 'info',
  Shipped: 'info',
  Delivered: 'success',
  Cancelled: 'destructive',
} as const;

export const orderColumns: CrudColumn<OrderRecord>[] = [
  {
    key: 'orderNumber',
    header: 'Order',
    sortable: true,
    render: (row) => <span className="font-medium text-foreground">{row.orderNumber}</span>,
  },
  { key: 'clientName', header: 'Client', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <StatusBadge status={row.status} variantMap={ORDER_STATUS_MAP} />,
  },
  {
    key: 'total',
    header: 'Total',
    sortable: true,
    type: 'currency',
    align: 'right',
    meta: { currencySymbol: '€' },
    render: (row) => row.total,
  },
  { key: 'orderDate', header: 'Order date', sortable: true, type: 'date', hideBelow: 'md' },
  { key: 'dueDate', header: 'Due', sortable: true, type: 'date', hideBelow: 'lg' },
  { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'lg' },
];

export { ORDER_STATUS_MAP };

export { ordersPageIcon } from '@/lib/modulePageIcons';
