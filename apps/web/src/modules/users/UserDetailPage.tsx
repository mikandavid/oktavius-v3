import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useDemoData } from '@/app/demo-data';
import { userRecordPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

import { USER_ROLE_VARIANT, USER_STATUS_VARIANT } from './shared';

export function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { users } = useDemoData();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const user = useMemo(() => users.find((entry) => entry.id === userId), [users, userId]);

  if (!user) {
    return (
      <ModulePage title="User not found" icon={userRecordPageIcon()} backTo="/users">
        <p className="text-sm text-muted-foreground">This user may have been removed.</p>
      </ModulePage>
    );
  }

  return (
    <>
      <ModulePage
        title={user.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{user.email}</span>
            <StatusBadge status={user.role} variantMap={USER_ROLE_VARIANT} />
            <StatusBadge status={user.status} variantMap={USER_STATUS_VARIANT} />
          </span>
        }
        icon={userRecordPageIcon()}
        backTo="/users"
        actions={
          <>
            <IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete user" />
          </>
        }
      >
        <DetailView
          title="User details"
          fields={[
            { label: 'Full name', value: user.name, importance: 'primary' },
            { label: 'Email', value: user.email, section: 'Contact' },
            { label: 'Team', value: user.team || '—', section: 'Organization' },
            {
              label: 'Role',
              value: <StatusBadge status={user.role} variantMap={USER_ROLE_VARIANT} />,
              section: 'Access',
            },
            {
              label: 'Status',
              value: <StatusBadge status={user.status} variantMap={USER_STATUS_VARIANT} />,
              section: 'Access',
            },
            {
              label: 'Platform admin',
              value: user.isSuperadmin ? 'Yes' : 'No',
              section: 'Access',
              importance: 'meta',
            },
          ]}
        />
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this user?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('User deleted.');
          navigate('/users');
        }}
      />
    </>
  );
}
