import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';

import { deleteOrganizationsFromList } from './organizationListActions';
import { OrganizationsHeaderAction, orgColumns, orgFilters, superadminPageIcon } from './shared';

export function SuperadminPage() {
  const api = useApiRegistry();
  const { organizations } = useDemoData();
  const loadOrganizations = useCallback(
    (params: StandardCrudListRequestParams) => api.organizations.list(params),
    [api.organizations],
  );

  return (
    <StandardCrudListPage
      title="Superadmin"
      subtitle="Platform organizations and environments"
      icon={superadminPageIcon()}
      headerActions={<OrganizationsHeaderAction />}
      rows={organizations}
      loadRows={loadOrganizations}
      columns={orgColumns}
      filters={orgFilters}
      defaultSort="name"
      filterKeys={['plan', 'status', 'environment']}
      searchKeys={['name', 'slug', 'region', 'ownerName', 'billingEmail']}
      searchPlaceholder="Search organizations"
      entityLabel="organization"
      getRowHref={(row) => `/superadmin/orgs/${row.id}`}
      onDeleteRows={(ids) =>
        deleteOrganizationsFromList(ids, { deleteOrganization: api.organizations.delete })
      }
      exportFileName="organizations"
      emptyTitle="No organizations found"
      emptyDescription="Create an organization or adjust your filters."
    />
  );
}
