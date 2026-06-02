import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { RecordEditDialog } from '@/components/common/RecordEditDialog';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { EntityDetailWorkspaceTabs } from '@/components/detail/EntityDetailWorkspaceTabs';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { useDemoData } from '@/app/demo-data';
import { invoicesPageIcon } from '@/lib/modulePageIcons';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

const INVOICE_DETAIL_TABS = ['overview', 'activity', 'files', 'assistant'] as const;

import { invoiceFormFields, invoiceStatusBadge, type InvoiceFormValues } from './shared';
import { buildInvoiceDetailFields } from './invoiceDetailFields';

export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { clients, invoices, orders } = useDemoData();
  const [activeTab, setActiveTab] = useUrlTabState('overview', INVOICE_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invoice = useMemo(
    () => invoices.find((entry) => entry.id === invoiceId),
    [invoices, invoiceId],
  );

  const updateInvoiceInline = useCallback(
    async (input: Parameters<typeof api.invoices.update>[1]) => {
      if (!invoice) return;
      try {
        await api.invoices.update(invoice.id, input);
        appToast.success('Invoice updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Invoice could not be updated.');
        throw error;
      }
    },
    [api, invoice],
  );
  const clientRelationOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.name,
        label: client.name,
        description: [client.city, client.industry].filter(Boolean).join(' · '),
      })),
    [clients],
  );
  const orderRelationOptions = useMemo(
    () =>
      orders.map((order) => ({
        value: order.orderNumber,
        label: order.orderNumber,
        description: [order.clientName, order.status].filter(Boolean).join(' · '),
      })),
    [orders],
  );

  useEntityAgentRegistration(
    invoice
      ? {
          entityType: 'invoice',
          entityId: invoice.id,
          displayLabel: invoice.invoiceNumber,
        }
      : null,
    { moduleId: 'invoices', moduleLabel: 'Invoices' },
  );

  if (!invoice) {
    return (
      <ModulePage title="Invoice not found" icon={invoicesPageIcon()} backTo="/invoices">
        <p className="text-sm text-muted-foreground">This invoice may have been removed.</p>
      </ModulePage>
    );
  }

  const editDefaults: InvoiceFormValues = {
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    orderNumber: invoice.orderNumber,
    status: invoice.status,
    amount: invoice.amount,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
  };

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
        actions={
          <DetailPageHeaderActions
            onEdit={() => setEditOpen(true)}
            editLabel="Edit invoice"
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete invoice"
          />
        }
      >
        <EntityDetailWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          entityType="invoice"
          entityId={invoice.id}
          overview={
            <DetailView
              title="Invoice details"
              fields={buildInvoiceDetailFields({
                invoice,
                onInlineUpdate: updateInvoiceInline,
                clientOptions: clientRelationOptions,
                orderOptions: orderRelationOptions,
              })}
            />
          }
        />
      </ModulePage>

      <RecordEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit invoice"
        fields={invoiceFormFields}
        defaultValues={editDefaults}
        isSubmitting={isSubmitting}
        onSubmit={async (values) => {
          setIsSubmitting(true);
          try {
            return await submitApiForm({
              action: () => api.invoices.update(invoice.id, values),
              onSuccess: () => {
                appToast.success('Invoice updated.');
              },
              onError: (error) => appToast.fromApiError(error, 'Invoice could not be updated.'),
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this invoice?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.invoices.delete(invoice.id),
            navigate,
            redirectTo: '/invoices',
            successMessage: 'Invoice deleted.',
            errorMessage: 'Invoice could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
