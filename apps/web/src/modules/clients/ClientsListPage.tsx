import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import type { ClientRecord } from '@/app/demo-data';
import { clientColumns, clientsPageIcon, ClientsHeaderAction } from './shared';

export function ClientsListPage() {
  const { clients } = useDemoData();

  const list = useListPageState<ClientRecord>({
    rows: clients,
    defaultSort: 'name',
    pageSize: 10,
    filterKeys: ['status', 'type'],
    filterFn: (client, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.industry.toLowerCase().includes(q) ||
        client.accountManager.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || client.status === filters.status;
      const matchesType = filters.type.length === 0 || client.type === filters.type;
      return matchesSearch && matchesStatus && matchesType;
    },
  });

  return (
    <CrudMainView
      title="Clients"
      subtitle="Manage client accounts, contracts, and relationships."
      icon={clientsPageIcon()}
      headerActions={<ClientsHeaderAction />}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search by name, email, industry…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Active', label: 'Active' },
            { value: 'Prospect', label: 'Prospect' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Churned', label: 'Churned' },
          ],
        },
        {
          key: 'type',
          label: 'Type',
          options: [
            { value: 'Company', label: 'Company' },
            { value: 'Individual', label: 'Individual' },
          ],
        },
      ]}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={clientColumns}
      allRows={list.filtered}
      exportOptions={{ fileName: 'clients', label: 'Export' }}
      emptyTitle="No clients found"
      emptyDescription="Try adjusting filters or create a new client."
      entityLabel="client"
      getRowHref={(c) => `/clients/${c.id}`}
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
