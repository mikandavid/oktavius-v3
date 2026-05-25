import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { MoneyText, formatDisplayDate } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { useDemoData } from '@/app/demo-data';
import { invoicesPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

import { invoiceStatusBadge } from './shared';

export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { invoices } = useDemoData();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const invoice = useMemo(
    () => invoices.find((entry) => entry.id === invoiceId),
    [invoices, invoiceId],
  );

  if (!invoice) {
    return (
      <ModulePage title="Invoice not found" icon={invoicesPageIcon()} backTo="/invoices">
        <p className="text-sm text-muted-foreground">This invoice may have been removed.</p>
      </ModulePage>
    );
  }

  return (
    <>
      <ModulePage
        title={invoice.invoiceNumber}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{invoice.clientName}</span>
            {invoiceStatusBadge(invoice.status)}
          </span>
        }
        icon={invoicesPageIcon()}
        backTo="/invoices"
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete invoice" />}
      >
        <DetailView
          title="Invoice details"
          fields={[
            { label: 'Invoice number', value: invoice.invoiceNumber, importance: 'primary' },
            { label: 'Client', value: invoice.clientName, section: 'Parties' },
            { label: 'Order', value: invoice.orderNumber, section: 'References' },
            {
              label: 'Status',
              value: invoiceStatusBadge(invoice.status),
              section: 'Payment',
            },
            {
              label: 'Amount',
              value: <MoneyText value={Number(invoice.amount)} currency="EUR" />,
              section: 'Payment',
            },
            {
              label: 'Issued',
              value: formatDisplayDate(invoice.issuedAt),
              section: 'Timeline',
            },
            {
              label: 'Due',
              value: formatDisplayDate(invoice.dueAt),
              section: 'Timeline',
            },
          ]}
        />
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this invoice?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('Invoice deleted.');
          navigate('/invoices');
        }}
      />
    </>
  );
}
