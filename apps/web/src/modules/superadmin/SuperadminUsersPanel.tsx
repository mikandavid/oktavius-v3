import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { CrudListShell } from '@/components/data/CrudListShell';
import { useListPageState } from '@/lib/useListPageState';

import { platformUserColumns } from './shared';

export function SuperadminUsersPanel() {
  const navigate = useNavigate();
  const { platformUsers } = useDemoData();

  const list = useListPageState({
    rows: platformUsers,
    defaultSort: 'name',
    pageSize: 10,
    filterKeys: ['status', 'role'],
    filterFn: (user, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.organizationNames.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || user.status === filters.status;
      const matchesRole = filters.role.length === 0 || user.role === filters.role;
      return matchesSearch && matchesStatus && matchesRole;
    },
  });

  return (
    <CrudListShell
      search={list.search}
      onSearchChange={list.onSearchChange}
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
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={platformUserColumns}
      emptyTitle="No users found"
      emptyDescription="Adjust filters or invite users to an organization."
      onRowClick={(user) => navigate(`/users/${user.id}`)}
      enableListCrud={false}
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
