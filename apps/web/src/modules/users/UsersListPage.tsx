import { useCallback } from 'react';

import { useApiRegistry } from '@/api/ApiProvider';
import { useDemoData } from '@/app/demo-data';
import {
  StandardCrudListPage,
  type StandardCrudListRequestParams,
} from '@/components/data/StandardCrudListPage';

import {
  USER_SAVED_VIEWS,
  UsersHeaderAction,
  userColumns,
  userFilters,
  usersPageIcon,
} from './shared';

export function UsersListPage() {
  const api = useApiRegistry();
  const { users } = useDemoData();
  const loadUsers = useCallback(
    (params: StandardCrudListRequestParams) => api.users.list(params),
    [api.users],
  );

  return (
    <StandardCrudListPage
      title="Users"
      subtitle="Team members and access roles"
      icon={usersPageIcon()}
      headerActions={<UsersHeaderAction />}
      rows={users}
      loadRows={loadUsers}
      columns={userColumns}
      filters={userFilters}
      savedViews={USER_SAVED_VIEWS}
      defaultSort="name"
      filterKeys={['role', 'status']}
      searchKeys={['name', 'email', 'team']}
      searchPlaceholder="Search users"
      entityLabel="user"
      getRowHref={(row) => `/users/${row.id}`}
      onDeleteRows={(ids) =>
        Promise.all(ids.map((id) => api.users.delete(id))).then(() => undefined)
      }
      exportFileName="users"
      emptyTitle="No users found"
      emptyDescription="Invite team members or adjust your filters."
    />
  );
}
