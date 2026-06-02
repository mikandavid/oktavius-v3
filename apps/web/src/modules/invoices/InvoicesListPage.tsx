import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';

import { INVOICE_SAVED_VIEWS, invoiceColumns, invoiceFilters, invoicesPageIcon } from './shared';

export function InvoicesListPage() {
  const api = useApiRegistry();
  const { invoices } = useDemoData();
  const loadInvoices = useCallback(
    (params: StandardCrudListRequestParams) => api.invoices.list(params),
    [api.invoices],
  );

  return (
    <StandardCrudListPage
      title="Invoices"
      subtitle="Billing documents and payment status"
      icon={invoicesPageIcon()}
      rows={invoices}
      loadRows={loadInvoices}
      columns={invoiceColumns}
      filters={invoiceFilters}
      savedViews={INVOICE_SAVED_VIEWS}
      defaultSort="issuedAt"
      filterKeys={['status', 'clientName']}
      searchKeys={['invoiceNumber', 'clientName', 'orderNumber']}
      searchPlaceholder="Search invoices"
      entityLabel="invoice"
      getRowHref={(row) => `/invoices/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.invoices.delete(id))).then(() => undefined)
      }
      exportFileName="invoices"
      emptyTitle="No invoices found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
