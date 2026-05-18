import { Button } from '@oktavius/base-ui';
import { UserPlus, Users } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import type { UserRecord } from '@/app/demo-data';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';

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
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    section: 'Additional',
    colSpan: 2,
    description: 'Temporary extraction note field for debugging shared form layouts.',
  },
];

export const userColumns = [
  {
    key: 'name',
    header: 'User',
    render: (user: UserRecord) => user.name,
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    render: (user: UserRecord) => user.email,
    sortable: true,
  },
  {
    key: 'role',
    header: 'Role',
    render: (user: UserRecord) => user.role,
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    render: (user: UserRecord) => <StatusBadge status={user.status} />,
    sortable: true,
  },
  {
    key: 'team',
    header: 'Team',
    render: (user: UserRecord) => user.team,
    sortable: true,
  },
];

export function usersHeaderAction() {
  return (
    <Link to="/users/new">
      <Button variant="cta">
        <UserPlus size={16} />
        Create user
      </Button>
    </Link>
  );
}

export function usersPageIcon() {
  return <Users size={20} weight="duotone" />;
}
