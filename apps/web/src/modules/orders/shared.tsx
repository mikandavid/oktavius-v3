import type { BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { SavedViewPreset } from '@/components/data/useListSavedViews';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { OrderRecord } from '@/app/demo-data';
import { ordersPageIcon } from '@/lib/modulePageIcons';

export { ordersPageIcon };

export const ORDER_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Draft: 'secondary',
  Confirmed: 'info',
  Shipped: 'warning',
  Delivered: 'success',
  Cancelled: 'destructive',
};

export const orderColumns: CrudColumn<OrderRecord>[] = [
  { key: 'orderNumber', header: 'Order', sortable: true },
  { key: 'clientName', header: 'Client', sortable: true },
  statusColumn('status', 'Status', ORDER_STATUS_VARIANT),
  { key: 'total', header: 'Total', sortable: true, type: 'currency', align: 'right' },
  { key: 'orderDate', header: 'Order date', sortable: true, type: 'date', hideBelow: 'md' },
  { key: 'dueDate', header: 'Due date', sortable: true, type: 'date', hideBelow: 'lg' },
  { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'lg' },
  { key: 'lineCount', header: 'Lines', sortable: true, hideBelow: 'lg' },
];

export const orderFilters: FilterDef[] = [
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
  {
    key: 'owner',
    label: 'Owner',
    options: [
      { value: 'Anna Hofer', label: 'Anna Hofer' },
      { value: 'Markus Leitner', label: 'Markus Leitner' },
      { value: 'Nina Weiss', label: 'Nina Weiss' },
    ],
  },
  {
    key: 'clientName',
    label: 'Client',
    options: [
      { value: 'Apex Technologies GmbH', label: 'Apex Technologies GmbH' },
      { value: 'Bruckner Consulting', label: 'Bruckner Consulting' },
      { value: 'Donau Logistics AG', label: 'Donau Logistics AG' },
      { value: 'Clara Sonnenschein', label: 'Clara Sonnenschein' },
    ],
  },
];

export function orderStatusBadge(status: OrderRecord['status']) {
  return <StatusBadge status={status} variantMap={ORDER_STATUS_VARIANT} />;
}

export const ORDER_SAVED_VIEWS: SavedViewPreset[] = [
  {
    id: 'all',
    label: 'All orders',
    isDefault: true,
    filters: { status: '', owner: '', clientName: '' },
  },
  { id: 'open', label: 'Confirmed', filters: { status: 'Confirmed', owner: '', clientName: '' } },
  { id: 'shipped', label: 'Shipped', filters: { status: 'Shipped', owner: '', clientName: '' } },
];
