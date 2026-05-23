import { useMemo, useState } from 'react';

import { useDemoData } from '@/app/demo-data';
import { CrudMainView } from '@/components/data/CrudMainView';
import { sortRows } from '@/lib/sortRows';

import { userColumns, usersHeaderAction, usersPageIcon } from './shared';

export function UsersListPage() {
  const { users } = useDemoData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({ status: '', role: '' });
  const [sort, setSort] = useState('name');

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        search.length === 0 ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.team.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filters.status.length === 0 || user.status === filters.status;
      const matchesRole = filters.role.length === 0 || user.role === filters.role;
      return matchesSearch && matchesStatus && matchesRole;
    });

    return sortRows(filtered, sort);
  }, [filters.role, filters.status, search, sort, users]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <CrudMainView
      title="Users"
      subtitle="Simple entity lists should use the shared table system."
      icon={usersPageIcon()}
      headerActions={usersHeaderAction()}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
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
      rows={pagedUsers}
      columns={userColumns}
      emptyTitle="No users found"
      emptyDescription="This module should default to a dense shared CRUD list view instead of a custom layout."
      entityLabel="user"
      getRowHref={(user) => `/users/${user.id}`}
      sort={sort}
      onSortChange={(nextSort) => {
        setSort(nextSort);
        setPage(1);
      }}
      page={safePage}
      pageSize={pageSize}
      total={filteredUsers.length}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}
