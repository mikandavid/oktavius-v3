import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';

import type { UserRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FormField } from '@/components/forms/EntityForm';
import { UserAddIcon } from '@/lib/icons';

export const userFormFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    section: 'Identity',
    description: 'Primary display name for the ERP user record.',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    section: 'Identity',
    description: 'Used for login, notifications, and user-level communications.',
  },
  {
    name: 'team',
    label: 'Team',
    type: 'text',
    required: true,
    section: 'Assignment',
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    options: ['Admin', 'Manager', 'Member'],
    required: true,
    section: 'Assignment',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Pending', 'Suspended'],
    required: true,
    section: 'Assignment',
  },
];

export const userColumns: CrudColumn<UserRecord>[] = [
  { key: 'name', header: 'User', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', sortable: true, type: 'status' },
  { key: 'team', header: 'Team', sortable: true },
];

export function usersHeaderAction() {
  return (
    <PageHeaderCtaLink to="/users/new">
      <UserAddIcon size={14} />
      Create user
    </PageHeaderCtaLink>
  );
}

export { usersPageIcon, userRecordPageIcon } from '@/lib/modulePageIcons';
