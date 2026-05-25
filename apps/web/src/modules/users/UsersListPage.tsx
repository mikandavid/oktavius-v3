import { useEffect, useState } from 'react';

import { CrudMainView } from '@/components/data/CrudMainView';
import { useDemoData } from '@/app/demo-data';
import { useListPageState } from '@/lib/useListPageState';

import { UsersHeaderAction, userColumns, userFilters, usersPageIcon } from './shared';

export function UsersListPage() {
  const { users } = useDemoData();
  const [rows, setRows] = useState(users);

  useEffect(() => {
    setRows(users);
  }, [users]);

  const list = useListPageState({
    rows,
    defaultSort: 'name',
    filterKeys: ['role', 'status'],
    searchKeys: ['name', 'email', 'team'],
  });

  return (
    <CrudMainView
      title="Users"
      subtitle="Team members and access roles"
      icon={usersPageIcon()}
      headerActions={<UsersHeaderAction />}
      columns={userColumns}
      rows={list.paged}
      sort={list.sort}
      onSortChange={list.onSortChange}
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder="Search users"
      filters={userFilters}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      entityLabel="user"
      getRowHref={(row) => `/users/${row.id}`}
      onDeleteRows={(ids) => setRows((current) => current.filter((row) => !ids.includes(row.id)))}
      exportOptions={{ fileName: 'users', label: 'Export' }}
      allRows={list.filtered}
      emptyTitle="No users found"
      emptyDescription="Invite team members or adjust your filters."
    />
  );
}
