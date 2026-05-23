import type { InvoiceRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import { StatusBadge } from '@/components/feedback/StatusBadge';

const INVOICE_STATUS_MAP = {
  Draft: 'warning',
  Sent: 'info',
  Paid: 'success',
  Overdue: 'destructive',
  Cancelled: 'destructive',
} as const;

export const invoiceColumns: CrudColumn<InvoiceRecord>[] = [
  {
    key: 'invoiceNumber',
    header: 'Invoice',
    sortable: true,
    render: (row) => <span className="font-medium text-foreground">{row.invoiceNumber}</span>,
  },
  { key: 'clientName', header: 'Client', sortable: true },
  { key: 'orderNumber', header: 'Order', sortable: true, hideBelow: 'md' },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <StatusBadge status={row.status} variantMap={INVOICE_STATUS_MAP} />,
  },
  {
    key: 'amount',
    header: 'Amount',
    sortable: true,
    type: 'currency',
    align: 'right',
    meta: { currencySymbol: '€' },
    render: (row) => row.amount,
  },
  { key: 'issuedAt', header: 'Issued', sortable: true, type: 'date', hideBelow: 'lg' },
  { key: 'dueAt', header: 'Due', sortable: true, type: 'date', hideBelow: 'lg' },
];

export { INVOICE_STATUS_MAP };

export { invoicesPageIcon } from '@/lib/modulePageIcons';
