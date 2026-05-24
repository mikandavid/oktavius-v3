import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { invoiceColumns, invoicesPageIcon } from './shared';

export function InvoicesListPage() {
  const { invoices } = useDemoData();

  const list = useListPageState({
    rows: invoices,
    defaultSort: '-issuedAt',
    pageSize: 10,
    filterKeys: ['status'],
    filterFn: (invoice, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.clientName.toLowerCase().includes(q) ||
        invoice.orderNumber.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || invoice.status === filters.status;
      return matchesSearch && matchesStatus;
    },
  });

  return (
    <CrudMainView
      title="Invoices"
      subtitle="Billing documents linked to sales orders and clients."
      icon={invoicesPageIcon()}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search invoice, client, order…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Draft', label: 'Draft' },
            { value: 'Sent', label: 'Sent' },
            { value: 'Paid', label: 'Paid' },
            { value: 'Overdue', label: 'Overdue' },
          ],
        },
      ]}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={invoiceColumns}
      allRows={list.filtered}
      exportOptions={{ fileName: 'invoices', label: 'Export' }}
      emptyTitle="No invoices found"
      entityLabel="invoice"
      getRowHref={(inv) => `/invoices/${inv.id}`}
      sort={list.sort}
      onSortChange={list.onSortChange}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
    />
  );
}
