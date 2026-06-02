import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { EntityDetailWorkspaceTabs } from '@/components/detail/EntityDetailWorkspaceTabs';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useDemoData } from '@/app/demo-data';
import { userRecordPageIcon } from '@/lib/modulePageIcons';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { appToast } from '@/lib/toast';

const USER_DETAIL_TABS = ['overview', 'activity', 'files', 'assistant'] as const;

import { USER_ROLE_VARIANT, USER_STATUS_VARIANT } from './shared';
import { buildUserDetailFields } from './userDetailFields';

export function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { users } = useDemoData();
  const [activeTab, setActiveTab] = useUrlTabState('overview', USER_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const user = useMemo(() => users.find((entry) => entry.id === userId), [users, userId]);
  const updateUserInline = useCallback(
    async (input: Parameters<typeof api.users.update>[1]) => {
      if (!user) return;

      try {
        await api.users.update(user.id, input);
        appToast.success('User updated.');
      } catch (error) {
        appToast.fromApiError(error, 'User could not be updated.');
        throw error;
      }
    },
    [api, user],
  );

  useEntityAgentRegistration(
    user
      ? {
          entityType: 'user',
          entityId: user.id,
          displayLabel: user.name,
        }
      : null,
    { moduleId: 'users', moduleLabel: 'Users' },
  );

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
          <DetailPageHeaderActions
            editTo={`/users/${user.id}/edit`}
            editLabel="Edit user"
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete user"
          />
        }
      >
        <EntityDetailWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          entityType="user"
          entityId={user.id}
          overview={
            <DetailView
              title="User details"
              fields={buildUserDetailFields({ user, onInlineUpdate: updateUserInline })}
            />
          }
        />
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this user?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.users.delete(user.id),
            navigate,
            redirectTo: '/users',
            successMessage: 'User deleted.',
            errorMessage: 'User could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
