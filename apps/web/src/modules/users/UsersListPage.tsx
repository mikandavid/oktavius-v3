import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { useListPageState } from '@/lib/useListPageState';

import { userColumns, usersHeaderAction, usersPageIcon } from './shared';

export function UsersListPage() {
  const { users } = useDemoData();

  const list = useListPageState({
    rows: users,
    defaultSort: 'name',
    pageSize: 5,
    filterKeys: ['status', 'role'],
    filterFn: (user, { search, filters }) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.team.toLowerCase().includes(q);
      const matchesStatus = filters.status.length === 0 || user.status === filters.status;
      const matchesRole = filters.role.length === 0 || user.role === filters.role;
      return matchesSearch && matchesStatus && matchesRole;
    },
  });

  return (
    <CrudMainView
      title="Users"
      subtitle="Simple entity lists should use the shared table system."
      icon={usersPageIcon()}
      headerActions={usersHeaderAction()}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search users, teams, or email"
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
      columns={userColumns}
      emptyTitle="No users found"
      emptyDescription="This module should default to a dense shared CRUD list view instead of a custom layout."
      entityLabel="user"
      getRowHref={(user) => `/users/${user.id}`}
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
