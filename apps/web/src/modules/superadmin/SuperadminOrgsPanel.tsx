import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { CrudListShell } from '@/components/data/CrudListShell';
import { buildStandardListCrudActions } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { organizationColumns } from './shared';

export function SuperadminOrgsPanel() {
  const navigate = useNavigate();
  const { organizations } = useDemoData();

  const list = useListPageState({
    rows: organizations,
    defaultSort: 'name',
    pageSize: 10,
    filterKeys: ['status', 'plan', 'environment'],
    filterFn: (org, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        org.name.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q) ||
        org.billingEmail.toLowerCase().includes(q) ||
        org.ownerName.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || org.status === filters.status;
      const matchesPlan = filters.plan.length === 0 || org.plan === filters.plan;
      const matchesEnvironment =
        filters.environment.length === 0 || org.environment === filters.environment;
      return matchesSearch && matchesStatus && matchesPlan && matchesEnvironment;
    },
  });

  const listCrud = useMemo(
    () =>
      buildStandardListCrudActions({
        entityLabel: 'organization',
        getDetailHref: (org) => `/superadmin/orgs/${org.id}`,
        navigate,
      }),
    [navigate],
  );

  return (
    <CrudListShell
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search organization, slug, billing email…"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: [
            { value: 'Active', label: 'Active' },
            { value: 'Trial', label: 'Trial' },
            { value: 'Suspended', label: 'Suspended' },
            { value: 'Churned', label: 'Churned' },
          ],
        },
        {
          key: 'plan',
          label: 'Plan',
          options: [
            { value: 'Starter', label: 'Starter' },
            { value: 'Professional', label: 'Professional' },
            { value: 'Enterprise', label: 'Enterprise' },
          ],
        },
        {
          key: 'environment',
          label: 'Environment',
          options: [
            { value: 'Production', label: 'Production' },
            { value: 'Sandbox', label: 'Sandbox' },
            { value: 'Trial', label: 'Trial' },
          ],
        },
      ]}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={organizationColumns}
      emptyTitle="No organizations found"
      emptyDescription="Create a tenant or adjust filters."
      getRowHref={(org) => `/superadmin/orgs/${org.id}`}
      entityLabel="organization"
      rowActions={listCrud.rowActions}
      bulkActions={listCrud.bulkActions}
      selectable={listCrud.selectable}
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
