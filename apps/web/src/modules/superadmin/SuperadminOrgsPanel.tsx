import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { CrudTable } from '@/components/data/CrudTable';
import { buildStandardListCrudActions } from '@/components/data/standardListCrud';
import { FilterToolbar } from '@/components/data/FilterToolbar';
import { Pagination } from '@/components/data/Pagination';
import { sortRows } from '@/lib/sortRows';

import { organizationColumns } from './shared';

export function SuperadminOrgsPanel() {
  const navigate = useNavigate();
  const { organizations } = useDemoData();
  const listCrud = useMemo(
    () =>
      buildStandardListCrudActions({
        entityLabel: 'organization',
        getDetailHref: (org) => `/superadmin/orgs/${org.id}`,
        navigate,
      }),
    [navigate],
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: '',
    plan: '',
    environment: '',
  });
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = organizations.filter((org) => {
      const matchesSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q) ||
        org.billingEmail.toLowerCase().includes(q) ||
        org.ownerName.toLowerCase().includes(q);
      const matchesStatus = !filters.status || org.status === filters.status;
      const matchesPlan = !filters.plan || org.plan === filters.plan;
      const matchesEnvironment = !filters.environment || org.environment === filters.environment;
      return matchesSearch && matchesStatus && matchesPlan && matchesEnvironment;
    });
    return sortRows(rows, sort);
  }, [organizations, search, filters, sort]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-card bg-card">
      <div className="border-b border-border/50">
        <FilterToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
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
          values={filters}
          onFilterChange={(key, value) => {
            setFilters((current) => ({ ...current, [key]: value }));
            setPage(1);
          }}
          onReset={() => {
            setSearch('');
            setFilters({ status: '', plan: '', environment: '' });
            setPage(1);
          }}
        />
      </div>
      <CrudTable
        columnStretch="all"
        data={paged}
        columns={organizationColumns}
        emptyTitle="No organizations found"
        emptyDescription="Create a tenant or adjust filters."
        onRowClick={(org) => navigate(`/superadmin/orgs/${org.id}`)}
        {...listCrud}
        sort={sort}
        onSortChange={(nextSort) => {
          setSort(nextSort);
          setPage(1);
        }}
      />
      <div className="border-t border-border/50">
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={filtered.length}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
