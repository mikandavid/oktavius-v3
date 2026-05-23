import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { CrudTable } from '@/components/data/CrudTable';
import { FilterToolbar } from '@/components/data/FilterToolbar';
import { Pagination } from '@/components/data/Pagination';
import { sortRows } from '@/lib/sortRows';

import { platformUserColumns } from './shared';

export function SuperadminUsersPanel() {
  const navigate = useNavigate();
  const { platformUsers } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '', role: '' });
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = platformUsers.filter((user) => {
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.organizationNames.toLowerCase().includes(q);
      const matchesStatus = !filters.status || user.status === filters.status;
      const matchesRole = !filters.role || user.role === filters.role;
      return matchesSearch && matchesStatus && matchesRole;
    });
    return sortRows(rows, sort);
  }, [platformUsers, search, filters, sort]);

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
          searchPlaceholder="Search user, email, organization…"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Suspended', label: 'Suspended' },
              ],
            },
            {
              key: 'role',
              label: 'Role',
              options: [
                { value: 'Admin', label: 'Admin' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Member', label: 'Member' },
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
            setFilters({ status: '', role: '' });
            setPage(1);
          }}
        />
      </div>
      <CrudTable
        columnStretch="all"
        data={paged}
        columns={platformUserColumns}
        emptyTitle="No users found"
        emptyDescription="Adjust filters or invite users to an organization."
        onRowClick={(user) => navigate(`/users/${user.id}`)}
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
