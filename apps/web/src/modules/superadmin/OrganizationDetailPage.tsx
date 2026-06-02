import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge, ListRow, SectionCard } from '@oktavius/base-ui';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useDemoData } from '@/app/demo-data';
import { organizationPageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';

import { ORG_ENV_VARIANT, ORG_PLAN_VARIANT, ORG_STATUS_VARIANT } from './shared';
import { buildOrganizationDetailFields } from './organizationDetailFields';

export function OrganizationDetailPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { organizations, getOrgMembers } = useDemoData();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const organization = useMemo(
    () => organizations.find((entry) => entry.id === orgId),
    [organizations, orgId],
  );
  const updateOrganizationInline = useCallback(
    async (input: Parameters<typeof api.organizations.update>[1]) => {
      if (!organization) return;

      try {
        await api.organizations.update(organization.id, input);
        appToast.success('Organization updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Organization could not be updated.');
        throw error;
      }
    },
    [api, organization],
  );

  const members = useMemo(() => (orgId ? getOrgMembers(orgId) : []), [getOrgMembers, orgId]);

  if (!organization) {
    return (
      <ModulePage title="Organization not found" icon={organizationPageIcon()} backTo="/superadmin">
        <p className="text-sm text-muted-foreground">This organization may have been removed.</p>
      </ModulePage>
    );
  }

  return (
    <>
      <ModulePage
        title={organization.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{organization.slug}</span>
            <StatusBadge status={organization.plan} variantMap={ORG_PLAN_VARIANT} />
            <StatusBadge status={organization.status} variantMap={ORG_STATUS_VARIANT} />
            <StatusBadge status={organization.environment} variantMap={ORG_ENV_VARIANT} />
          </span>
        }
        icon={organizationPageIcon()}
        backTo="/superadmin"
        actions={
          <IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete organization" />
        }
      >
        <div className="space-y-4">
          <DetailView
            title="Organization details"
            fields={buildOrganizationDetailFields({
              organization,
              onInlineUpdate: updateOrganizationInline,
            })}
          />

          <SectionCard title="Members" meta={`${members.length} linked users`}>
            {members.length ? (
              members.map((membership) => (
                <ListRow
                  key={membership.id}
                  title={membership.user.name}
                  subtitle={
                    <>
                      <span className="block">{membership.user.email}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{membership.role}</Badge>
                        <Badge variant="secondary">{membership.user.team}</Badge>
                      </span>
                    </>
                  }
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No members linked to this organization.
              </p>
            )}
          </SectionCard>
        </div>
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this organization?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.organizations.delete(organization.id),
            navigate,
            redirectTo: '/superadmin',
            successMessage: 'Organization deleted.',
            errorMessage: 'Organization could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
