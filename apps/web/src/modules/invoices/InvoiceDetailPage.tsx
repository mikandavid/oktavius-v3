import { Link, Navigate, useParams } from 'react-router-dom';

import { MoneyText } from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDisplayDate } from '@/lib/formatDate';

import { INVOICE_STATUS_MAP, invoicesPageIcon } from './shared';

export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { invoices } = useDemoData();
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice) return <Navigate to="/invoices" replace />;

  return (
    <ModulePage
      title={invoice.invoiceNumber}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>{invoice.clientName}</span>
          <StatusBadge status={invoice.status} variantMap={INVOICE_STATUS_MAP} />
        </span>
      }
      icon={invoicesPageIcon()}
      backTo="/invoices"
    >
      <DetailView
        title="Invoice details"
        fields={[
          {
            key: 'amount',
            label: 'Amount',
            value: <MoneyText value={invoice.amount} />,
            section: 'Billing',
          },
          {
            key: 'client',
            label: 'Client',
            value: invoice.clientName,
            section: 'Billing',
          },
          {
            key: 'order',
            label: 'Sales order',
            value: (
              <Link to="/orders" className="text-sm underline underline-offset-2">
                {invoice.orderNumber}
              </Link>
            ),
            section: 'Billing',
          },
          { key: 'issued', label: 'Issued', value: formatDisplayDate(invoice.issuedAt), section: 'Dates' },
          { key: 'due', label: 'Due', value: formatDisplayDate(invoice.dueAt), section: 'Dates' },
        ]}
      />
    </ModulePage>
  );
}
