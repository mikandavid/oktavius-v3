import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { invoiceColumns, invoiceFilters, invoicesPageIcon } from './shared';

export function InvoicesListPage() {
  const { invoices } = useDemoData();
  const [rows, setRows] = useState(invoices);

  useEffect(() => {
    setRows(invoices);
  }, [invoices]);

  const list = useListPageState({
    rows,
    defaultSort: 'issuedAt',
    filterKeys: ['status', 'clientName'],
    searchKeys: ['invoiceNumber', 'clientName', 'orderNumber'],
  });

  return (
    <CrudMainView
      title="Invoices"
      subtitle="Billing documents and payment status"
      icon={invoicesPageIcon()}
      columns={invoiceColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search invoices"
      filters={invoiceFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="invoice"
      getRowHref={(row) => `/invoices/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'invoices', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No invoices found"
      emptyDescription="Adjust your filters or search terms."
    />
  );
}
