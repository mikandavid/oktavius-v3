import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { Button } from '@oktavius/base-ui';
import { useDemoData } from '@/app/demo-data';
import { DeleteIcon, UserCircleIcon } from '@/lib/icons';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';

export function UserDetailPage() {
  const { userId } = useParams();
  const { users } = useDemoData();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const user = users.find((entry) => entry.id === userId);
  if (!user) {
    return <Navigate to="/users" replace />;
  }

  return (
    <ModulePage
      title={user.name}
      subtitle="Detail screens should reuse a standard sectioned record view."
      icon={<UserCircleIcon size={20} weight="duotone" />}
      backTo="/users"
      actions={
        <Button variant="outline" onClick={() => setConfirmDeleteOpen(true)}>
          <DeleteIcon size={16} />
          Delete
        </Button>
      }
    >
      <DetailView
        title="User record"
        subtitle="Sectioned detail groups should follow the same information hierarchy across modules."
        fields={[
          {
            key: 'id',
            label: 'User ID',
            value: <span className="font-mono text-xs">{user.id}</span>,
            section: 'Identity',
          },
          { key: 'email', label: 'Email', value: user.email, section: 'Identity' },
          { key: 'role', label: 'Role', value: user.role, section: 'Assignment' },
          {
            key: 'status',
            label: 'Status',
            value: <StatusBadge status={user.status} />,
            section: 'Assignment',
          },
          { key: 'team', label: 'Team', value: user.team, section: 'Assignment' },
        ]}
      />
      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete sample user?"
        description="This is a temporary confirm dialog pattern for extraction-phase destructive actions."
        confirmLabel="Delete"
        onConfirm={() => undefined}
      />
    </ModulePage>
  );
}
