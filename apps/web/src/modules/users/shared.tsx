import type { BadgeProps } from '@oktavius/base-ui';

import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { FormField } from '@/components/forms/EntityForm';
import type { UserRecord } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { usersPageIcon } from '@/lib/modulePageIcons';

export { usersPageIcon };

export const USER_ROLE_VARIANT: Record<string, BadgeProps['variant']> = {
  Admin: 'info',
  Manager: 'warning',
  Member: 'secondary',
};

export const USER_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Active: 'success',
  Pending: 'warning',
  Suspended: 'destructive',
};

export const userColumns: CrudColumn<UserRecord>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  statusColumn('role', 'Role', USER_ROLE_VARIANT),
  statusColumn('status', 'Status', USER_STATUS_VARIANT),
  { key: 'team', header: 'Team', sortable: true },
];

export const userFilters: FilterDef[] = [
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'Admin', label: 'Admin' },
      { value: 'Manager', label: 'Manager' },
      { value: 'Member', label: 'Member' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Suspended', label: 'Suspended' },
    ],
  },
];

export type UserFormValues = {
  name: string;
  email: string;
  role: UserRecord['role'];
  status: UserRecord['status'];
  team: string;
};

export const userFormDefaults: UserFormValues = {
  name: '',
  email: '',
  role: 'Member',
  status: 'Pending',
  team: '',
};

export const userFormFields: FormField[] = [
  { name: 'name', label: 'Full name', type: 'text', required: true, section: 'Profile' },
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'Profile' },
  {
    name: 'role',
    label: 'Role',
    type: 'combobox',
    options: ['Admin', 'Manager', 'Member'],
    section: 'Access',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'combobox',
    options: ['Active', 'Pending', 'Suspended'],
    section: 'Access',
  },
  { name: 'team', label: 'Team', type: 'text', section: 'Organization' },
];

export function UsersHeaderAction() {
  return (
    <PageHeaderCtaLink to="/users/new">
      <PlusIcon size={14} />
      New user
    </PageHeaderCtaLink>
  );
}
