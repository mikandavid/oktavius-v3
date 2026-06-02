import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';
import { useOrgNavPaths, useOrgProfile } from '@/lib/org-profiles/useOrgProfile';

import {
  CLIENT_SAVED_VIEWS,
  ClientsListHeaderActions,
  clientColumns,
  clientFilters,
  clientsPageIcon,
} from './shared';
import { importClientsFromFile } from './clientImport';

export function ClientsListPage() {
  const api = useApiRegistry();
  const { clients } = useDemoData();
  const profile = useOrgProfile();
  const nav = useOrgNavPaths();
  const loadClients = useCallback(
    (params: StandardCrudListRequestParams) => api.clients.list(params),
    [api.clients],
  );

  return (
    <StandardCrudListPage
      title={profile.terminology.clients}
      subtitle={
        profile.industryKey === 'funeral'
          ? 'Auftraggeber, Friedhöfe, Pfarrer und Lieferanten'
          : 'Customer accounts and relationships'
      }
      icon={clientsPageIcon()}
      headerActions={
        <ClientsListHeaderActions onImport={(file) => importClientsFromFile(file, api.clients)} />
      }
      rows={clients}
      loadRows={loadClients}
      columns={clientColumns}
      filters={clientFilters}
      savedViews={CLIENT_SAVED_VIEWS}
      defaultSort="name"
      filterKeys={['status', 'type']}
      searchKeys={['name', 'email', 'industry', 'city', 'accountManager']}
      searchPlaceholder="Search clients"
      entityLabel="client"
      getRowHref={(row) => `${nav.clients}/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.clients.delete(id))).then(() => undefined)
      }
      exportFileName="clients"
      emptyTitle="No clients found"
      emptyDescription="Create a client or adjust your filters."
    />
  );
}
