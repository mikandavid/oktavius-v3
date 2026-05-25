import type { BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { InvoiceRecord } from '@/app/demo-data';
import { invoicesPageIcon } from '@/lib/modulePageIcons';

export { invoicesPageIcon };

export const INVOICE_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Draft: 'secondary',
  Sent: 'info',
  Paid: 'success',
  Overdue: 'destructive',
  Cancelled: 'destructive',
};

export const invoiceColumns: CrudColumn<InvoiceRecord>[] = [
  { key: 'invoiceNumber', header: 'Invoice', sortable: true },
  { key: 'clientName', header: 'Client', sortable: true },
  { key: 'orderNumber', header: 'Order', sortable: true, hideBelow: 'md' },
  statusColumn('status', 'Status', INVOICE_STATUS_VARIANT),
  { key: 'amount', header: 'Amount', sortable: true, type: 'currency', align: 'right' },
  { key: 'issuedAt', header: 'Issued', sortable: true, type: 'date', hideBelow: 'md' },
  { key: 'dueAt', header: 'Due', sortable: true, type: 'date', hideBelow: 'lg' },
];

export const invoiceFilters: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Draft', label: 'Draft' },
      { value: 'Sent', label: 'Sent' },
      { value: 'Paid', label: 'Paid' },
      { value: 'Overdue', label: 'Overdue' },
      { value: 'Cancelled', label: 'Cancelled' },
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

export function invoiceStatusBadge(status: InvoiceRecord['status']) {
  return <StatusBadge status={status} variantMap={INVOICE_STATUS_VARIANT} />;
}
